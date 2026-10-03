# Trip Planner Agent - Application Generation Prompt

## System Role
You are an expert software architect and AI engineer specializing in building agentic AI applications. Your task is to generate a complete, production-ready Trip Planner Agent application.

## Application Overview
Build an intelligent agentic assistant that plans personalized day trips based on user preferences including location, duration, budget, and interests.

## Core Requirements

### 1. Agent Architecture
Implement a goal-driven agent with perception, reasoning engine, action executor, memory, and feedback loop components.

### 2. Functional Capabilities
The agent must:
- Accept user inputs: location, trip duration, budget, date, interests, party size
- Search for relevant activities, restaurants, and points of interest
- Filter results based on user constraints (budget, ratings, accessibility)
- Optimize route for minimal travel time and cost
- Generate time-stamped itinerary with timing, locations, descriptions, and costs
- Provide alternative options for flexibility
- Export itinerary in multiple formats (JSON, Markdown)

### 3. Technical Stack
- **Language**: Python 3.9+
### 4. Agent Workflow
```
1. Parse User Input → Extract structured preferences
2. Search Activities → Query multiple sources for POIs
3. Filter & Rank → Apply constraints and preferences
4. Optimize Route → Solve traveling salesman problem with constraints
5. Generate Itinerary → Create time-stamped schedule
6. Format Output → Produce multiple export formats
7. Iterate (Optional) → Refine based on user feedback
```

### 5. Data Models
```python
class TripPreferences:
    location: str
    start_date: datetime
    duration_days: int
    budget: float
    interests: List[str]
    party_size: int
    accessibility_requirements: List[str]

class Activity:
    name: str
    category: str
    location: tuple[float, float]
    duration_minutes: int
    cost: float
    rating: float
    description: str
    operating_hours: dict

class ItineraryItem:
    time: datetime
    activity: Activity
    travel_time_to_next: int
    notes: str

class Itinerary:
    preferences: TripPreferences
    items: List[ItineraryItem]
    total_cost: float
    total_distance_km: float
    created_at: datetime
```

### 6. Key Algorithms
- **Activity Selection**: Multi-criteria decision analysis (MCDA) scoring
- **Route Optimization**: Genetic algorithm or OR-Tools VRP solver
- **Budget Allocation**: Dynamic programming for optimal distribution
- **Time Slot Assignment**: Constraint satisfaction problem (CSP)

### 7. API Design
```python
class TripPlannerAgent:
    def __init__(self, llm_client, search_client, maps_client):
        """Initialize agent with external service clients"""
        
    def plan_trip(self, preferences: TripPreferences) -> Itinerary:
        """Main entry point for trip planning"""
        
    def search_activities(self, preferences: TripPreferences) -> List[Activity]:
### 8. Error Handling
- Graceful degradation when APIs fail
- Retry logic with exponential backoff
- Fallback to cached/default activities
- User-friendly error messages
- Comprehensive logging

### 9. Testing Requirements
- Unit tests for all core functions (>80% coverage)
- Integration tests for agent workflow
- Mock external API responses
- Performance tests for optimization algorithms
- Edge case handling (empty results, budget exceeded, etc.)

### 10. Documentation
- Inline docstrings for all functions/classes
- Type hints throughout
- README with installation and usage examples
- API documentation
- Example notebooks demonstrating features

## Quality Standards
- Follow PEP 8 style guidelines
- Use type hints for all function signatures
- Implement comprehensive error handling
- Write clear, self-documenting code
- Include docstrings with examples
- Maintain separation of concerns
- Design for testability and extensibility

## Additional Features (Nice-to-Have)
- Multi-language support
- Weather integration for outdoor activities
- Real-time availability checking
- User preference learning from feedback
- Social sharing capabilities
- Mobile-responsive HTML output
- Offline mode with cached data

## Success Criteria
1. Agent successfully plans a day trip with 5+ activities
2. Route optimization reduces travel time by >20%
3. Budget constraints are respected with <5% variance
4. Response time <30 seconds for typical queries
5. All tests pass with >80% coverage
6. Code is well-documented and maintainable

## Deliverables Expected
- Complete source code in `src/` directory
- Comprehensive test suite in `tests/` directory
- Example usage scripts in `examples/` directory
- Requirements file with all dependencies
- Setup/installation instructions
- API documentation
- Architecture documentation

Generate the complete application following these specifications. Ensure all components work together seamlessly to create a functional, intelligent trip planning agent.
        """Search for relevant activities"""
        
    def filter_activities(self, activities: List[Activity], 
                         preferences: TripPreferences) -> List[Activity]:
        """Filter based on constraints"""
        
    def optimize_route(self, activities: List[Activity], 
                      preferences: TripPreferences) -> List[Activity]:
        """Optimize visiting order"""
        
    def generate_itinerary(self, activities: List[Activity], 
                          preferences: TripPreferences) -> Itinerary:
        """Create detailed itinerary"""
        
    def export_to_markdown(self, itinerary: Itinerary) -> str:
        """Export to Markdown format"""
        
    def export_to_json(self, itinerary: Itinerary) -> dict:
        """Export to JSON format"""
```
- **LLM Integration**: OpenAI API / Anthropic Claude / Local LLM support
- **Web Search**: SerpAPI / Google Custom Search / DuckDuckGo
- **Maps/Navigation**: Google Maps API / OpenStreetMap
- **Data Processing**: Pandas, NumPy
- **Optimization**: OR-Tools, scipy.optimize
- **Output**: JSON, Markdown, HTML templates
- **Testing**: pytest with >80% coverage