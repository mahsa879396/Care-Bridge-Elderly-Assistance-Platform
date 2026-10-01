# Care-Bridge-Elderly-Assistance-Platform
Care Bridge – Elderly Assistance Platform
One-Sentence Purpose Statement:
Care Bridge is a responsive web-based application designed to connect seniors with local volunteers in Finland by facilitating service request creation, location/language filtering, and status tracking for everyday assistance.
Relevance & Non-Trivial Nature:
Care Bridge provides a practical solution to senior isolation. It is a non-trivial full-stack system featuring role-based authentication (Senior & Volunteer), database persistence, multi-criteria request filtering, and dynamic state transitions (Pending $\rightarrow$ Accepted $\rightarrow$ Completed).
User Roles:
•	Senior: Creates help requests (e.g., groceries, mobility support) and tracks their status.
•	Volunteer: Browses nearby requests filtered by city/language and accepts tasks.
Core Features:
•	Role-Based Access & Authentication: Secure JWT-based login for Seniors and Volunteers.
•	Service Request Management: Full CRUD operations for creating, viewing, accepting, and completing requests.
•	Filtered Matching Feed: Volunteers filter available tasks based on location and language preference.
•	Live Status Dashboard: Dynamic dashboard showing request progress and volunteer contact details upon acceptance.
Technical Stack:
•	Platform: Responsive Web Application (React.js)
•	Backend: Node.js & Express.js (REST API, MVC Pattern)
•	Database: MongoDB & Mongoose
•	Authentication: JWT (JSON Web Tokens)
•	Version Control: Git & GitHub (Feature-Branching Workflow)
