from datetime import datetime

from fastapi import HTTPException, status

TYPE_MAP = {
    "string": str,
    "integer": int,
    "float": (int, float),
    "boolean": bool,
    "datetime": str,
}


def validate_sale_data(data: dict, template_fields: list[dict]) -> dict:
    errors = []

    for field in template_fields:
        name = field["name"]
        field_type = field["type"]
        required = field.get("required", True)

        if name not in data:
            if required:
                errors.append(f"Missing required field: '{name}'")
            continue

        value = data[name]
        expected = TYPE_MAP.get(field_type)

        if field_type == "datetime":
            try:
                datetime.fromisoformat(value)
            except (ValueError, TypeError):
                errors.append(f"Field '{name}' must be a valid ISO datetime string")
        elif field_type == "float":
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                errors.append(f"Field '{name}' must be a number")
        elif field_type == "integer":
            if isinstance(value, bool) or not isinstance(value, int):
                errors.append(f"Field '{name}' must be of type 'integer'")
        elif expected and not isinstance(value, expected):
            errors.append(f"Field '{name}' must be of type '{field_type}'")

    allowed_names = {f["name"] for f in template_fields}
    extra = set(data.keys()) - allowed_names
    if extra:
        errors.append(f"Unknown fields: {', '.join(extra)}")

    if errors:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=errors)

    return data
