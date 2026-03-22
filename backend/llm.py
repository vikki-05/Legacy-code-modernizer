print("Using lightweight converter...")

def convert_code(context):
    """
    Lightweight code formatter (no ML model)
    Works on free deployment
    """

    lines = context.split("\n")
    formatted = []

    indent = 0

    for line in lines:
        line = line.strip()

        # simple formatting rules
        if line.endswith("}"):
            indent -= 1

        formatted.append("    " * max(indent, 0) + line)

        if line.endswith("{"):
            indent += 1

    return "\n".join(formatted)