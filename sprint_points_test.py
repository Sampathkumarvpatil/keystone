import requests
import sys
import json
from datetime import datetime, timedelta

class SprintPointsCalculationTester:
    def __init__(self, base_url="https://d6a05c32-80f2-4019-848d-2ce25c3454c1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.project_id = None
        self.sprint_id = None
        self.task_id = None
        self.bug_id = None

    def run_request(self, method, endpoint, data=None, params=None):
        """Run a request to the API"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            if response.status_code >= 200 and response.status_code < 300:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"Request failed: {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"Request error: {str(e)}")
            return False, {}

    def create_project(self):
        """Create a test project"""
        data = {
            "name": f"Test Project {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "status": "In Progress",
            "priority": "High",
            "startDate": datetime.now().strftime("%Y-%m-%d"),
            "endDate": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        }
        success, response = self.run_request('POST', 'projects', data=data)
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"Created project with ID: {self.project_id}")
            return True
        return False

    def create_sprint(self):
        """Create a test sprint"""
        if not self.project_id:
            print("No project ID available")
            return False
        
        data = {
            "projectId": self.project_id,
            "name": f"Test Sprint {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "startDate": datetime.now().strftime("%Y-%m-%d"),
            "endDate": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
            "status": "Active",
            "committedPoints": 20,
            "acceptedPoints": 0,
            "addedPoints": 0,
            "descopedPoints": 0
        }
        success, response = self.run_request('POST', 'sprints', data=data)
        if success and 'id' in response:
            self.sprint_id = response['id']
            print(f"Created sprint with ID: {self.sprint_id}")
            return True
        return False

    def create_task(self):
        """Create a test task"""
        if not self.project_id or not self.sprint_id:
            print("No project or sprint ID available")
            return False
        
        data = {
            "projectId": self.project_id,
            "sprintId": self.sprint_id,
            "title": f"Test Task {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "description": "This is a test task",
            "status": "New",
            "priority": "Medium",
            "assigneeId": None,
            "estimatedHours": 8,
            "actualHours": 0
        }
        success, response = self.run_request('POST', 'tasks', data=data)
        if success and 'id' in response:
            self.task_id = response['id']
            print(f"Created task with ID: {self.task_id}")
            return True
        return False

    def create_bug(self):
        """Create a test bug"""
        if not self.project_id or not self.sprint_id:
            print("No project or sprint ID available")
            return False
        
        data = {
            "projectId": self.project_id,
            "sprintId": self.sprint_id,
            "taskId": self.task_id,
            "title": f"Test Bug {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "description": "This is a test bug",
            "status": "New",
            "priority": "High",
            "severity": "Medium",
            "assigneeId": None,
            "estimatedHours": 4,
            "actualHours": 0
        }
        success, response = self.run_request('POST', 'bugs', data=data)
        if success and 'id' in response:
            self.bug_id = response['id']
            print(f"Created bug with ID: {self.bug_id}")
            return True
        return False

    def update_task_with_hours(self):
        """Update task with actual hours"""
        if not self.task_id:
            print("No task ID available")
            return False
        
        data = {
            "status": "Done",
            "actualHours": 8
        }
        success, _ = self.run_request('PUT', f'tasks/{self.task_id}', data=data)
        if success:
            print(f"Updated task {self.task_id} with 8 hours")
            return True
        return False

    def update_bug_with_hours(self):
        """Update bug with actual hours"""
        if not self.bug_id:
            print("No bug ID available")
            return False
        
        data = {
            "status": "Done",
            "actualHours": 4
        }
        success, _ = self.run_request('PUT', f'bugs/{self.bug_id}', data=data)
        if success:
            print(f"Updated bug {self.bug_id} with 4 hours")
            return True
        return False

    def check_sprint_points(self):
        """Check if sprint accepted points are calculated correctly"""
        if not self.sprint_id:
            print("No sprint ID available")
            return False
        
        # Get the sprint to check if accepted points were updated
        success, response = self.run_request('GET', f'sprints/{self.sprint_id}')
        
        if not success:
            return False
        
        # Calculate expected points (8 hours = 1 story point)
        # We completed a task with 8 hours and a bug with 4 hours, so expected points = (8 + 4) / 8 = 1.5 rounded to 2
        expected_points = 2
        actual_points = response.get('acceptedPoints', 0)
        
        print(f"Sprint accepted points: {actual_points} (expected {expected_points})")
        
        if actual_points == expected_points:
            print("✅ Sprint accepted points calculation is correct")
            return True
        else:
            print("❌ Sprint accepted points calculation is incorrect")
            return False

def main():
    print("\n===== TESTING SPRINT ACCEPTED POINTS CALCULATION =====\n")
    
    # Setup
    tester = SprintPointsCalculationTester()
    
    # Create test data
    if not tester.create_project():
        print("Failed to create project")
        return 1
    
    if not tester.create_sprint():
        print("Failed to create sprint")
        return 1
    
    if not tester.create_task():
        print("Failed to create task")
        return 1
    
    if not tester.create_bug():
        print("Failed to create bug")
        return 1
    
    # Update task and bug with hours
    if not tester.update_task_with_hours():
        print("Failed to update task with hours")
        return 1
    
    if not tester.update_bug_with_hours():
        print("Failed to update bug with hours")
        return 1
    
    # Check if sprint accepted points are calculated correctly
    if not tester.check_sprint_points():
        print("Sprint accepted points calculation test failed")
        return 1
    
    print("\n✅ All tests passed")
    return 0

if __name__ == "__main__":
    sys.exit(main())