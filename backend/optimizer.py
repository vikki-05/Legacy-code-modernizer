import ast
import networkx as nx


def build_dependency_graph(code):
    tree = ast.parse(code)
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
    tree = ast.parse(code)
    functions = {}

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            start = node.lineno - 1
            end = node.end_lineno
            lines = code.splitlines()
            func_code = "\n".join(lines[start:end])
            functions[node.name] = func_code

    return functions


def get_relevant_context(code, target_function):
    graph = build_dependency_graph(code)
    functions = extract_function_code(code)

    # Get dependencies
    deps = nx.descendants(graph, target_function)
    relevant_funcs = [target_function] + list(deps)

    context = "\n\n".join(
        functions[func] for func in relevant_funcs if func in functions
    )

    return context


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