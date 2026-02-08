from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.template import Template, TemplateVersion
from app.schemas.template import TemplateCreateRequest, TemplateUpdateRequest


class TemplateService:
    def __init__(self, db: Session):
        self.db = db

    def list_templates(self, skip: int = 0, limit: int = 50) -> tuple[list[Template], int]:
        total = self.db.query(func.count(Template.id)).scalar()

        templates = (
            self.db.query(Template)
            .options(joinedload(Template.versions))
            .offset(skip)
            .limit(limit)
            .all()
        )

        for template in templates:
            template.latest_version = self._find_latest_version(template.versions)

        return templates, total

    def get_template(self, template_id: int) -> Template | None:
        template = (
            self.db.query(Template)
            .options(joinedload(Template.versions))
            .filter(Template.id == template_id)
            .first()
        )

        if template:
            template.latest_version = self._find_latest_version(template.versions)

        return template

    def create_template(self, request: TemplateCreateRequest) -> Template:
        template = Template(name=request.name, description=request.description)
        self.db.add(template)
        self.db.flush()

        first_version = TemplateVersion(
            template_id=template.id,
            version_number=1,
            content=request.content,
        )
        self.db.add(first_version)
        self.db.commit()
        self.db.refresh(template)

        template.latest_version = first_version
        return template

    def update_template(self, template_id: int, request: TemplateUpdateRequest) -> Template | None:
        template = self.get_template(template_id)
        if not template:
            return None

        if request.name is not None:
            template.name = request.name
        if request.description is not None:
            template.description = request.description

        if request.content is not None:
            current_max = self._find_max_version_number(template.versions)
            new_version = TemplateVersion(
                template_id=template.id,
                version_number=current_max + 1,
                content=request.content,
            )
            self.db.add(new_version)

        self.db.commit()
        self.db.refresh(template)

        return self.get_template(template_id)

    def delete_template(self, template_id: int) -> bool:
        template = self.db.query(Template).filter(Template.id == template_id).first()
        if not template:
            return False

        self.db.delete(template)
        self.db.commit()
        return True

    def get_template_versions(self, template_id: int) -> list[TemplateVersion]:
        return (
            self.db.query(TemplateVersion)
            .filter(TemplateVersion.template_id == template_id)
            .order_by(TemplateVersion.version_number.desc())
            .all()
        )

    def _find_latest_version(self, versions: list[TemplateVersion]) -> TemplateVersion | None:
        if not versions:
            return None
        return max(versions, key=lambda v: v.version_number)

    def _find_max_version_number(self, versions: list[TemplateVersion]) -> int:
        if not versions:
            return 0
        return max(v.version_number for v in versions)
