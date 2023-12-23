# parse_args() must be called before any other imports. if it is not called first, consumers of the config
# which are imported/used before parse_args() is called will get the default config values instead of the
# values from the command line or config file.
import sys

from invokeai.version.invokeai_version import __version__

from .services.config import InvokeAIAppConfig

app_config = InvokeAIAppConfig.get_config()
app_config.parse_args()
if app_config.version:
    print(f"InvokeAI version {__version__}")
    sys.exit(0)

if True:  # hack to make flake8 happy with imports coming after setting up the config
    import asyncio
    import mimetypes
    import socket
    from inspect import signature
    from pathlib import Path
    from typing import Any

    import uvicorn
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.middleware.gzip import GZipMiddleware
    from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
    from fastapi.openapi.utils import get_openapi
    from fastapi.responses import FileResponse, HTMLResponse
    from fastapi.staticfiles import StaticFiles
    from fastapi_events.handlers.local import local_handler
    from fastapi_events.middleware import EventHandlerASGIMiddleware
    from pydantic.json_schema import models_json_schema
    from torch.backends.mps import is_available as is_mps_available

    # for PyCharm:
    # noinspection PyUnresolvedReferences
    import invokeai.backend.util.hotfixes  # noqa: F401 (monkeypatching on import)
    import invokeai.frontend.web as web_dir

    from ..backend.util.logging import InvokeAILogger
    from .api.dependencies import ApiDependencies
    from .api.routers import (
        app_info,
        board_images,
        boards,
        download_queue,
        images,
        model_records,
        models,
        session_queue,
        sessions,
        utilities,
        workflows,
    )
    from .api.sockets import SocketIO
    from .invocations.baseinvocation import (
        BaseInvocation,
        InputFieldJSONSchemaExtra,
        OutputFieldJSONSchemaExtra,
        UIConfigBase,
    )

    if is_mps_available():
        import invokeai.backend.util.mps_fixes  # noqa: F401 (monkeypatching on import)


app_config = InvokeAIAppConfig.get_config()
app_config.parse_args()
logger = InvokeAILogger.get_logger(config=app_config)
# fix for windows mimetypes registry entries being borked
# see https://github.com/invoke-ai/InvokeAI/discussions/3684#discussioncomment-6391352
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")

# Create the app
# TODO: create this all in a method so configuration/etc. can be passed in?
app = FastAPI(title="Invoke AI", docs_url=None, redoc_url=None, separate_input_output_schemas=False)

# Add event handler
event_handler_id: int = id(app)
app.add_middleware(
    EventHandlerASGIMiddleware,
    handlers=[local_handler],  # TODO: consider doing this in services to support different configurations
    middleware_id=event_handler_id,
)

socket_io = SocketIO(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_config.allow_origins,
    allow_credentials=app_config.allow_credentials,
    allow_methods=app_config.allow_methods,
    allow_headers=app_config.allow_headers,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Add startup event to load dependencies
@app.on_event("startup")
async def startup_event() -> None:
    ApiDependencies.initialize(config=app_config, event_handler_id=event_handler_id, logger=logger)


# Shut down threads
@app.on_event("shutdown")
async def shutdown_event() -> None:
    ApiDependencies.shutdown()


# Include all routers
app.include_router(sessions.session_router, prefix="/api")

app.include_router(utilities.utilities_router, prefix="/api")
app.include_router(models.models_router, prefix="/api")
app.include_router(model_records.model_records_router, prefix="/api")
app.include_router(download_queue.download_queue_router, prefix="/api")
app.include_router(images.images_router, prefix="/api")
app.include_router(boards.boards_router, prefix="/api")
app.include_router(board_images.board_images_router, prefix="/api")
app.include_router(app_info.app_router, prefix="/api")
app.include_router(session_queue.session_queue_router, prefix="/api")
app.include_router(workflows.workflows_router, prefix="/api")


# Build a custom OpenAPI to include all outputs
# TODO: can outputs be included on metadata of invocation schemas somehow?
def custom_openapi() -> dict[str, Any]:
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        description="An API for invoking AI image operations",
        version="1.0.0",
        routes=app.routes,
        separate_input_output_schemas=False,  # https://fastapi.tiangolo.com/how-to/separate-openapi-schemas/
    )

    # Add all outputs
    all_invocations = BaseInvocation.get_invocations()
    output_types = set()
    output_type_titles = {}
    for invoker in all_invocations:
        output_type = signature(invoker.invoke).return_annotation
        output_types.add(output_type)

    output_schemas = models_json_schema(
        models=[(o, "serialization") for o in output_types], ref_template="#/components/schemas/{model}"
    )
    for schema_key, output_schema in output_schemas[1]["$defs"].items():
        # TODO: note that we assume the schema_key here is the TYPE.__name__
        # This could break in some cases, figure out a better way to do it
        output_type_titles[schema_key] = output_schema["title"]

    # Add Node Editor UI helper schemas
    ui_config_schemas = models_json_schema(
        [
            (UIConfigBase, "serialization"),
            (InputFieldJSONSchemaExtra, "serialization"),
            (OutputFieldJSONSchemaExtra, "serialization"),
        ],
        ref_template="#/components/schemas/{model}",
    )
    for schema_key, ui_config_schema in ui_config_schemas[1]["$defs"].items():
        openapi_schema["components"]["schemas"][schema_key] = ui_config_schema

    # Add a reference to the output type to additionalProperties of the invoker schema
    for invoker in all_invocations:
        invoker_name = invoker.__name__  # type: ignore [attr-defined] # this is a valid attribute
        output_type = signature(obj=invoker.invoke).return_annotation
        output_type_title = output_type_titles[output_type.__name__]
        invoker_schema = openapi_schema["components"]["schemas"][f"{invoker_name}"]
        outputs_ref = {"$ref": f"#/components/schemas/{output_type_title}"}
        invoker_schema["output"] = outputs_ref
        invoker_schema["class"] = "invocation"
        openapi_schema["components"]["schemas"][f"{output_type_title}"]["class"] = "output"

    from invokeai.backend.model_management.models import get_model_config_enums

    for model_config_format_enum in set(get_model_config_enums()):
        name = model_config_format_enum.__qualname__

        if name in openapi_schema["components"]["schemas"]:
            # print(f"Config with name {name} already defined")
            continue

        openapi_schema["components"]["schemas"][name] = {
            "title": name,
            "description": "An enumeration.",
            "type": "string",
            "enum": [v.value for v in model_config_format_enum],
        }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi  # type: ignore [method-assign] # this is a valid assignment


@app.get("/docs", include_in_schema=False)
def overridden_swagger() -> HTMLResponse:
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,  # type: ignore [arg-type] # this is always a string
        title=app.title,
        swagger_favicon_url="/static/docs/favicon.ico",
    )


@app.get("/redoc", include_in_schema=False)
def overridden_redoc() -> HTMLResponse:
    return get_redoc_html(
        openapi_url=app.openapi_url,  # type: ignore [arg-type] # this is always a string
        title=app.title,
        redoc_favicon_url="/static/docs/favicon.ico",
    )


web_root_path = Path(list(web_dir.__path__)[0])

# Only serve the UI if we it has a build
if (web_root_path / "dist").exists():
    # Cannot add headers to StaticFiles, so we must serve index.html with a custom route
    # Add cache-control: no-store header to prevent caching of index.html, which leads to broken UIs at release
    @app.get("/", include_in_schema=False, name="ui_root")
    def get_index() -> FileResponse:
        return FileResponse(Path(web_root_path, "dist/index.html"), headers={"Cache-Control": "no-store"})

    # # Must mount *after* the other routes else it borks em
    app.mount("/assets", StaticFiles(directory=Path(web_root_path, "dist/assets/")), name="assets")
    app.mount("/locales", StaticFiles(directory=Path(web_root_path, "dist/locales/")), name="locales")

app.mount("/static", StaticFiles(directory=Path(web_root_path, "static/")), name="static")  # docs favicon is in here


def invoke_api() -> None:
    def find_port(port: int) -> int:
        """Find a port not in use starting at given port"""
        # Taken from https://waylonwalker.com/python-find-available-port/, thanks Waylon!
        # https://github.com/WaylonWalker
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("localhost", port)) == 0:
                return find_port(port=port + 1)
            else:
                return port

    from invokeai.backend.install.check_root import check_invokeai_root

    check_invokeai_root(app_config)  # note, may exit with an exception if root not set up

    if app_config.dev_reload:
        try:
            import jurigged
        except ImportError as e:
            logger.error(
                'Can\'t start `--dev_reload` because jurigged is not found; `pip install -e ".[dev]"` to include development dependencies.',
                exc_info=e,
            )
        else:
            jurigged.watch(logger=InvokeAILogger.get_logger(name="jurigged").info)

    port = find_port(app_config.port)
    if port != app_config.port:
        logger.warn(f"Port {app_config.port} in use, using port {port}")

    # Start our own event loop for eventing usage
    loop = asyncio.new_event_loop()
    config = uvicorn.Config(
        app=app,
        host=app_config.host,
        port=port,
        loop="asyncio",
        log_level=app_config.log_level,
        ssl_certfile=app_config.ssl_certfile,
        ssl_keyfile=app_config.ssl_keyfile,
    )
    server = uvicorn.Server(config)

    # replace uvicorn's loggers with InvokeAI's for consistent appearance
    for logname in ["uvicorn.access", "uvicorn"]:
        log = InvokeAILogger.get_logger(logname)
        log.handlers.clear()
        for ch in logger.handlers:
            log.addHandler(ch)

    loop.run_until_complete(server.serve())


if __name__ == "__main__":
    invoke_api()
