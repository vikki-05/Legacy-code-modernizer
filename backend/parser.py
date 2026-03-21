import ast
import networkx as nx

print("Parser starting...")


def build_dependency_graph(code):
    tree = ast.parse(code)
    graph = nx.DiGraph()

    class FunctionCallVisitor(ast.NodeVisitor):
        def __init__(self):
            self.current_function = None

        def visit_FunctionDef(self, node):
            self.current_function = node.name
            graph.add_node(node.name)

            self.generic_visit(node)

        def visit_Call(self, node):
            if self.current_function:
                if isinstance(node.func, ast.Name):
                    called_func = node.func.id
                    graph.add_edge(self.current_function, called_func)

            self.generic_visit(node)

    visitor = FunctionCallVisitor()
    visitor.visit(tree)

    return graph


# TEST
if __name__ == "__main__":
    sample_code = """
def A():
    B()

def B():
    C()

def C():
    pass
"""

    graph = build_dependency_graph(sample_code)

    print("Dependencies:")
    for edge in graph.edges():
        print(f"{edge[0]} → {edge[1]}")