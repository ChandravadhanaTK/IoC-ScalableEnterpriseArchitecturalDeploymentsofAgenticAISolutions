# Development Guide

## Project Structure

```
TripPlannerAgent/
├── src/                    # Source code
│   ├── __init__.py
│   ├── models.py          # Data models
│   ├── agent.py           # Main agent orchestrator
│   ├── planner.py         # Itinerary planning logic
│   ├── searcher.py        # Activity search integration
│   ├── optimizer.py       # Route and budget optimization
│   └── utils.py           # Utility functions
├── tests/                  # Test suite
│   ├── test_agent.py
│   ├── test_planner.py
│   └── test_optimizer.py
├── examples/               # Usage examples
│   ├── basic_usage.py
│   └── advanced_features.py
├── docs/                   # Documentation
│   ├── prompt.md          # LLM generation prompt
│   └── DELIVERABLES.md    # Capstone deliverables
├── requirements.txt
├── setup.py
├── pytest.ini
└── README.md
```

## Setup

```bash
# Clone repository
git clone <repository-url>
cd TripPlannerAgent

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install package in development mode
pip install -e .
```

## Running Examples

```bash
# Basic usage
python examples/basic_usage.py

# Advanced features
python examples/advanced_features.py
```

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_agent.py -v

# Run with markers
pytest -m "not slow"
```

## Architecture

### Agent Workflow

1. **Perceive**: Parse user input → `TripPreferences`
2. **Reason**: Search activities → Filter → Optimize
3. **Act**: Generate itinerary → Format output
4. **Observe**: Validate → Refine if needed

### Component Interaction

```
User Input → Agent → Searcher → Optimizer → Planner → Itinerary
              ↓         ↓          ↓           ↓
           Parser   Activities  Route    Schedule
                            Budget    Format
```

## Adding New Features

### Adding a New Search Source

1. Create new method in `ActivitySearcher`
2. Add API key to config
3. Implement result parsing
4. Add error handling and retries

### Adding a New Optimization Strategy

1. Create new optimizer class in `optimizer.py`
2. Implement optimization algorithm
3. Integrate into `ItineraryOptimizer`
4. Add tests

### Adding a New Export Format

1. Add method to `Itinerary` class
2. Implement format conversion
3. Add tests for output validation

## Configuration

### API Keys

Set environment variables or pass in config:

```python
config = {
    'api_keys': {
        'google_places': 'your-key',
        'yelp': 'your-key',
        'tripadvisor': 'your-key'
    }
}

agent = create_agent(**config)
```

### Logging

```python
# Set log level
agent = create_agent(log_level="DEBUG")

# Or configure globally
import logging
logging.basicConfig(level=logging.INFO)
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Code Style

- Follow PEP 8
- Use type hints
- Write docstrings (Google style)
- Maintain test coverage >80%
- Use meaningful variable names

## Troubleshooting

### No activities found
- Check API keys are set
- Verify location format
- Try broader search terms

### Rate limiting
- Increase delay in `rate_limit()`
- Use caching
- Implement request queuing

### Import errors
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`
- Check Python version >= 3.9