from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages
import operator
class WorkerState(TypedDict):
    messages: Annotated[list, add_messages]
    angle: str
    iteration_count: int

class WorkerResult(TypedDict):
    angle: str
    findings: str
    sources: list[str]
    tool_history: list[dict]

class OverallState(TypedDict):
    messages: Annotated[list, add_messages]
    research_angles: list[str]
    worker_results: Annotated[list[WorkerResult], operator.add]
