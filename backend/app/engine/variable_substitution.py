import re

VARIABLE_PATTERN = re.compile(r"\{\{(\w+)\}\}")


def substitute_variables(content: str, variables: dict[str, str]) -> str:
    def replace_match(match: re.Match) -> str:
        name = match.group(1)
        if name not in variables:
            raise ValueError(f"Missing variable: {name}")
        return variables[name]

    return VARIABLE_PATTERN.sub(replace_match, content)


def extract_variables(content: str) -> list[str]:
    return list(dict.fromkeys(VARIABLE_PATTERN.findall(content)))
