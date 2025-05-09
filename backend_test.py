import requests
import sys
import json
from datetime import datetime

class AgileTrackingAPITester:
    def __init__(self, base_url="https://d6a05c32-80f2-4019-848d-2ce25c3454c1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                    return False, response.json()
                except:
                    return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root endpoint"""
        return self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )

    def test_status_endpoint(self):
        """Test the status endpoint"""
        client_name = f"test_client_{datetime.now().strftime('%H%M%S')}"
        success, response = self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": client_name}
        )
        
        if success:
            success, response = self.run_test(
                "Get Status Checks",
                "GET",
                "status",
                200
            )
            return success
        return False
    
    def test_sprints_endpoints(self):
        """Test sprint-related endpoints"""
        # Get all sprints
        get_success, sprints = self.run_test(
            "Get All Sprints",
            "GET",
            "sprints",
            200
        )
        
        if not get_success:
            return False
        
        # Create a new sprint
        new_sprint = {
            "projectId": 1,
            "name": f"Test Sprint {datetime.now().strftime('%H%M%S')}",
            "startDate": "2025-02-01",
            "endDate": "2025-02-15",
            "status": "Active",
            "committedPoints": 30,
            "addedPoints": 5,
            "descopedPoints": 2
        }
        
        create_success, created_sprint = self.run_test(
            "Create Sprint",
            "POST",
            "sprints",
            201,
            data=new_sprint
        )
        
        if not create_success or 'id' not in created_sprint:
            return False
        
        sprint_id = created_sprint['id']
        
        # Get the created sprint
        get_one_success, _ = self.run_test(
            f"Get Sprint {sprint_id}",
            "GET",
            f"sprints/{sprint_id}",
            200
        )
        
        if not get_one_success:
            return False
        
        # Update the sprint
        update_data = {
            "name": f"Updated Sprint {datetime.now().strftime('%H%M%S')}",
            "status": "Completed"
        }
        
        update_success, _ = self.run_test(
            f"Update Sprint {sprint_id}",
            "PUT",
            f"sprints/{sprint_id}",
            200,
            data=update_data
        )
        
        if not update_success:
            return False
        
        # Delete the sprint
        delete_success, _ = self.run_test(
            f"Delete Sprint {sprint_id}",
            "DELETE",
            f"sprints/{sprint_id}",
            200
        )
        
        return delete_success
    
    def test_time_tracking_endpoints(self):
        """Test time tracking endpoints"""
        # Get all time entries
        get_success, entries = self.run_test(
            "Get All Time Entries",
            "GET",
            "time-entries",
            200
        )
        
        if not get_success:
            return False
        
        # Create a new time entry
        new_entry = {
            "taskId": 1,
            "isTaskEntry": True,
            "projectId": 1,
            "sprintId": 1,
            "date": datetime.now().strftime('%Y-%m-%d'),
            "hours": 2.5,
            "description": f"Test time entry {datetime.now().strftime('%H%M%S')}"
        }
        
        create_success, created_entry = self.run_test(
            "Create Time Entry",
            "POST",
            "time-entries",
            201,
            data=new_entry
        )
        
        if not create_success or 'id' not in created_entry:
            return False
        
        entry_id = created_entry['id']
        
        # Get the created time entry
        get_one_success, _ = self.run_test(
            f"Get Time Entry {entry_id}",
            "GET",
            f"time-entries/{entry_id}",
            200
        )
        
        if not get_one_success:
            return False
        
        # Delete the time entry
        delete_success, _ = self.run_test(
            f"Delete Time Entry {entry_id}",
            "DELETE",
            f"time-entries/{entry_id}",
            200
        )
        
        return delete_success
    
    def test_task_update_with_time(self):
        """Test that adding time to a completed task updates its actual hours"""
        # First, get a completed task
        get_tasks_success, tasks = self.run_test(
            "Get Tasks",
            "GET",
            "tasks",
            200
        )
        
        if not get_tasks_success or not tasks:
            return False
        
        # Find a completed task
        completed_task = None
        for task in tasks:
            if task.get('status') == 'Done':
                completed_task = task
                break
        
        if not completed_task:
            print("No completed tasks found for testing")
            return False
        
        # Record the current actual hours
        task_id = completed_task['id']
        current_hours = completed_task.get('actualHours', 0)
        
        # Add time to the task
        hours_to_add = 1.5
        new_entry = {
            "taskId": task_id,
            "isTaskEntry": True,
            "projectId": completed_task['projectId'],
            "sprintId": completed_task.get('sprintId'),
            "date": datetime.now().strftime('%Y-%m-%d'),
            "hours": hours_to_add,
            "description": f"Testing actual hours update {datetime.now().strftime('%H%M%S')}"
        }
        
        create_success, created_entry = self.run_test(
            "Create Time Entry for Completed Task",
            "POST",
            "time-entries",
            201,
            data=new_entry
        )
        
        if not create_success:
            return False
        
        # Get the task again to check if hours were updated
        get_task_success, updated_task = self.run_test(
            f"Get Updated Task {task_id}",
            "GET",
            f"tasks/{task_id}",
            200
        )
        
        if not get_task_success:
            return False
        
        # Check if actual hours were updated
        new_hours = updated_task.get('actualHours', 0)
        expected_hours = current_hours + hours_to_add
        
        if abs(new_hours - expected_hours) < 0.01:  # Allow for floating point comparison
            print(f"✅ Task actual hours correctly updated from {current_hours} to {new_hours}")
            return True
        else:
            print(f"❌ Task actual hours not updated correctly. Expected: {expected_hours}, Got: {new_hours}")
            return False

def main():
    # Setup
    tester = AgileTrackingAPITester()
    
    # Run tests
    print("\n===== TESTING BACKEND API =====")
    root_success, _ = tester.test_root_endpoint()
    status_success = tester.test_status_endpoint()
    sprints_success = tester.test_sprints_endpoints()
    time_tracking_success = tester.test_time_tracking_endpoints()
    task_update_success = tester.test_task_update_with_time()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    print("\n===== BACKEND API TEST SUMMARY =====")
    print(f"Root endpoint: {'✅ PASSED' if root_success else '❌ FAILED'}")
    print(f"Status endpoint: {'✅ PASSED' if status_success else '❌ FAILED'}")
    print(f"Sprints endpoints: {'✅ PASSED' if sprints_success else '❌ FAILED'}")
    print(f"Time tracking endpoints: {'✅ PASSED' if time_tracking_success else '❌ FAILED'}")
    print(f"Task update with time: {'✅ PASSED' if task_update_success else '❌ FAILED'}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())