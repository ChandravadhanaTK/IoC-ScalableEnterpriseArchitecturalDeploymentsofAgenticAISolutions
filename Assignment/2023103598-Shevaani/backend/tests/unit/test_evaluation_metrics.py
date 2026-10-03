from app.analyzer.evaluation import (
    ConfusionCounts,
    calculate_metrics,
    compare_predictions,
    evaluate_detectors,
    macro_average,
    safe_divide,
)
from app.services.analysis_service import _execution_metrics
from app.services.repository_ingestion import IngestionResult


def test_confusion_matrix_counts_tp_tn_fp_fn():
    assert compare_predictions([True, False, True, False], [True, False, False, True]) == ConfusionCounts(1, 1, 1, 1)


def test_accuracy_precision_recall_and_f1():
    metrics = calculate_metrics(ConfusionCounts(tp=3, tn=4, fp=1, fn=2))
    assert metrics.accuracy == 7 / 10
    assert metrics.precision == 3 / 4
    assert metrics.recall == 3 / 5
    assert metrics.f1 == 2 * (3 / 4) * (3 / 5) / ((3 / 4) + (3 / 5))


def test_macro_averages_are_unweighted_detector_averages():
    scores = evaluate_detectors()
    macro = macro_average(scores)
    assert len(scores) == 5
    assert macro.accuracy == sum(item.accuracy for item in scores.values()) / 5
    assert macro.precision == sum(item.precision for item in scores.values()) / 5
    assert macro.recall == sum(item.recall for item in scores.values()) / 5
    assert macro.f1 == sum(item.f1 for item in scores.values()) / 5


def test_zero_denominators_remain_unavailable():
    metrics = calculate_metrics(ConfusionCounts(tp=0, tn=2, fp=0, fn=0))
    assert safe_divide(1, 0) is None
    assert metrics.accuracy == 1
    assert metrics.precision is None
    assert metrics.recall is None
    assert metrics.f1 is None


def test_execution_rates_use_actual_file_loc_counts_and_elapsed_time():
    ingestion = IngestionResult("test", "sample", "zip_upload", "INGESTED", 8, 5, [])
    result = {"repository": {"python_files": 5}, "metrics": {"lines_of_code": 1200}}
    metrics = _execution_metrics(ingestion, result, 4.0)
    assert metrics["files_processed"] == 8
    assert metrics["python_files"] == 5
    assert metrics["lines_of_code"] == 1200
    assert metrics["total_execution_seconds"] == 4.0
    assert metrics["files_per_second"] == 2
    assert metrics["seconds_per_file"] == 0.5
    assert metrics["loc_per_second"] == 300
    assert metrics["seconds_per_1000_loc"] == 3.333333


def test_execution_rates_report_unavailable_per_unit_for_empty_counts():
    ingestion = IngestionResult("test", "sample", "zip_upload", "INGESTED", 0, 0, [])
    result = {"repository": {"python_files": 0}, "metrics": {"lines_of_code": 0}}
    metrics = _execution_metrics(ingestion, result, 1.0)
    assert metrics["seconds_per_file"] == "N/A"
    assert metrics["seconds_per_1000_loc"] == "N/A"

def test_execution_metrics_include_python_file_rates():
    ingestion = IngestionResult(
        "test",
        "sample",
        "zip_upload",
        "INGESTED",
        8,
        5,
        [],
    )

    result = {
        "repository": {
            "python_files": 5,
        },
        "metrics": {
            "lines_of_code": 1200,
        },
    }

    metrics = _execution_metrics(
        ingestion,
        result,
        4.0,
    )

    assert metrics["files_processed"] == 8
    assert metrics["python_files"] == 5
    assert metrics["non_python_files"] == 3

    assert metrics["files_per_second"] == 2
    assert metrics["seconds_per_file"] == 0.5

    assert metrics["python_files_per_second"] == 1.25
    assert metrics["seconds_per_python_file"] == 0.8

    assert metrics["loc_per_second"] == 300
    assert metrics["seconds_per_1000_loc"] == 3.333333