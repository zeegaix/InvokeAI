from abc import ABC, abstractmethod
from logging import Logger
from invokeai.app.services.board_image_record_storage import BoardImageRecordStorageBase
from invokeai.app.services.board_record_storage import (
    BoardDTO,
    BoardRecord,
    BoardRecordStorageBase,
)

from invokeai.app.services.image_record_storage import (
    ImageRecordStorageBase,
    OffsetPaginatedResults,
)
from invokeai.app.services.models.image_record import ImageDTO, image_record_to_dto
from invokeai.app.services.urls import UrlServiceBase


class BoardImagesServiceABC(ABC):
    """High-level service for board-image relationship management."""

    @abstractmethod
    def add_image_to_board(
        self,
        board_id: str,
        image_name: str,
    ) -> None:
        """Adds an image to a board."""
        pass

    @abstractmethod
    def remove_image_from_board(
        self,
        board_id: str,
        image_name: str,
    ) -> None:
        """Removes an image from a board."""
        pass

    @abstractmethod
    def get_images_for_board(
        self,
        board_id: str,
    ) -> OffsetPaginatedResults[ImageDTO]:
        """Gets images for a board."""
        pass

    @abstractmethod
    def get_boards_for_image(
        self,
        image_name: str,
    ) -> OffsetPaginatedResults[BoardDTO]:
        """Gets boards for an image."""
        pass


class BoardImagesServiceDependencies:
    """Service dependencies for the BoardImagesService."""

    board_image_records: BoardImageRecordStorageBase
    board_records: BoardRecordStorageBase
    image_records: ImageRecordStorageBase
    urls: UrlServiceBase
    logger: Logger

    def __init__(
        self,
        board_image_record_storage: BoardImageRecordStorageBase,
        image_record_storage: ImageRecordStorageBase,
        board_record_storage: BoardRecordStorageBase,
        url: UrlServiceBase,
        logger: Logger,
    ):
        self.board_image_records = board_image_record_storage
        self.image_records = image_record_storage
        self.board_records = board_record_storage
        self.urls = url
        self.logger = logger


class BoardImagesService(BoardImagesServiceABC):
    _services: BoardImagesServiceDependencies

    def __init__(self, services: BoardImagesServiceDependencies):
        self._services = services

    def add_image_to_board(
        self,
        board_id: str,
        image_name: str,
    ) -> None:
        self._services.board_image_records.add_image_to_board(board_id, image_name)

    def remove_image_from_board(
        self,
        board_id: str,
        image_name: str,
    ) -> None:
        self._services.board_image_records.remove_image_from_board(board_id, image_name)

    def get_images_for_board(
        self,
        board_id: str,
    ) -> OffsetPaginatedResults[ImageDTO]:
        image_records = self._services.board_image_records.get_images_for_board(
            board_id
        )
        image_dtos = list(
            map(
                lambda r: image_record_to_dto(
                    r,
                    self._services.urls.get_image_url(r.image_name),
                    self._services.urls.get_image_url(r.image_name, True),
                ),
                image_records.items,
            )
        )
        return OffsetPaginatedResults[ImageDTO](
            items=image_dtos,
            offset=image_records.offset,
            limit=image_records.limit,
            total=image_records.total,
        )

    def get_boards_for_image(
        self,
        image_name: str,
    ) -> OffsetPaginatedResults[BoardDTO]:
        board_records = self._services.board_image_records.get_boards_for_image(
            image_name
        )
        board_dtos = []

        for r in board_records.items:
            cover_image_url = (
                self._services.urls.get_image_url(r.cover_image_name, True)
                if r.cover_image_name
                else None
            )
            image_count = self._services.board_image_records.get_image_count_for_board(
                r.board_id
            )
            board_dtos.append(
                board_record_to_dto(
                    r,
                    cover_image_url,
                    image_count,
                )
            )

        return OffsetPaginatedResults[BoardDTO](
            items=board_dtos,
            offset=board_records.offset,
            limit=board_records.limit,
            total=board_records.total,
        )


def board_record_to_dto(
    board_record: BoardRecord, cover_image_url: str | None, image_count: int
) -> BoardDTO:
    """Converts a board record to a board DTO."""
    return BoardDTO(
        **board_record.dict(),
        cover_image_url=cover_image_url,
        image_count=image_count,
    )