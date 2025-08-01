class DataManager {
    // Constructor: Initializes data stores for projects and events
    constructor() {
        // Arrays to hold project and event data
        this.projects = [];
        this.events = [];
        // Call method to set up initial data (currently empty for database readiness)
        this.initializeDummyData();
    }

    // Method: Placeholder for initializing dummy data; kept empty to avoid conflicts with future database entries
    initializeDummyData() {
        // Previously contained dummy data; removed for database integration
    }

    // Method: Retrieves a copy of the projects array to prevent direct manipulation
    // Returns: Array of Project objects
    getProjects() {
        return [...this.projects];
    }

    // Method: Retrieves a copy of the events array to prevent direct manipulation
    // Returns: Array of Event objects
    getEvents() {
        return [...this.events];
    }

    // Method: Placeholder for async loading of data from a database
    // Future: Will fetch projects and events from backend API
    // Returns: Promise resolving to { projects, events }
    async loadFromDatabase() {
        // Example implementation:
        // const response = await fetch('/api/data');
        // this.projects = await response.json().projects;
        // this.events = await response.json().events;
        // return { projects: this.projects, events: this.events };
    }
}

// Export DataManager for use in other modules
export default DataManager;

// Class: Defines the structure of a Project entity
class Project {
    // Constructor: Initializes a project with provided data
    // Params: data (object) - Contains project properties
    constructor(data) {
        this.id = data.id;                    // Integer: Unique identifier
        this.name = data.name;                // String: Project title
        this.description = data.description;  // Text: Project details
        this.category = data.category;        // String: Project type (e.g., Gundam)
        this.image = data.image;              // String: Primary image URL (legacy)
        this.images = data.images || [];      // Array of Strings: Image URLs
        this.criteria = data.criteria || [];  // Array of Strings: Completion tasks
        this.completedCriteria = data.completedCriteria || []; // Array of Integers: Indices of completed criteria
        this.tags = data.tags || [];          // Array of Strings: Keywords
        this.status = data.status || 'active'; // Enum: 'active' or 'complete'
        this.progress = data.progress || 0;   // Integer: Completion percentage (0-100)
        this.planToComplete = data.planToComplete; // Date: Target completion date
        this.logbook = data.logbook || [];    // Array of Objects: Log entries {date: Date, entry: Text}
        this.createdDate = data.createdDate || new Date().toISOString(); // Timestamp: Creation date
    }
}

// Class: Defines the structure of an Event entity
class Event {
    // Constructor: Initializes an event with provided data
    // Params: data (object) - Contains event properties
    constructor(data) {
        this.id = data.id;                    // Integer: Unique identifier
        this.title = data.title;              // String: Event name
        this.date = data.date;                // Date: Event date
        this.location = data.location;        // String: Event location
        this.description = data.description;  // Text: Event details
        this.plan = data.plan;                // Text: Event plan
        this.type = data.type;                // String: Event type (e.g., 'user-created')
    }
}