import ast
import networkx as nx


def build_dependency_graph(code):
    try:
      tree = ast.parse(code)
    except:
     return nx.DiGraph()  # return empty graph for non-python
    graph = nx.DiGraph()

    class Visitor(ast.NodeVisitor):
        def __init__(self):
            self.current_function = None

        def visit_FunctionDef(self, node):
            self.current_function = node.name
            graph.add_node(node.name)
            self.generic_visit(node)

        def visit_Call(self, node):
            if self.current_function and isinstance(node.func, ast.Name):
                graph.add_edge(self.current_function, node.func.id)
            self.generic_visit(node)

    Visitor().visit(tree)
    return graph


def extract_function_code(code):
    try:
      tree = ast.parse(code)
    except:
      return {}  # no functions for non-python
    functions = {}

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            start = node.lineno - 1
            end = node.end_lineno
            lines = code.splitlines()
            func_code = "\n".join(lines[start:end])
            functions[node.name] = func_code

    return functions


def get_relevant_context(code, function_name):
    try:
        lines = code.split("\n")

        # Keep only lines related to main function
        if function_name in code:
            filtered = []
            keep = False

            for line in lines:
                if function_name in line:
                    keep = True
                if keep:
                    filtered.append(line)

            # return only part of code (pruned)
            return "\n".join(filtered[:max(3, len(filtered)//2)])

        return code

    except:
        return code


# TEST
if __name__ == "__main__":
    sample_code = """
def A():
    B()

def B():
    C()

def C():
    pass

def D():
    pass
"""

    context = get_relevant_context(sample_code, "A")
    print("Optimized Context:\n")
    print(context)