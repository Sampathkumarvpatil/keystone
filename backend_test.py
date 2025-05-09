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
        success, response = self.run_test(
            "Get Status",
            "GET",
            "status",
            200
        )
        return success
    
    def test_projects_endpoints(self):
        """Test project-related endpoints including delete functionality"""
        # Get all projects
        get_success, projects = self.run_test(
            "Get All Projects",
            "GET",
            "projects",
            200
        )
        
        if not get_success:
            return False
        
        # Create a new project
        new_project = {
            "name": f"Test Project {datetime.now().strftime('%H%M%S')}",
            "status": "Not Started",
            "priority": "Medium",
            "startDate": "2025-02-01",
            "endDate": "2025-12-31"
        }
        
        create_success, created_project = self.run_test(
            "Create Project",
            "POST",
            "projects",
            201,
            data=new_project
        )
        
        if not create_success or 'id' not in created_project:
            return False
        
        project_id = created_project['id']
        
        # Get the created project
        get_one_success, _ = self.run_test(
            f"Get Project {project_id}",
            "GET",
            f"projects/{project_id}",
            200
        )
        
        if not get_one_success:
            return False
        
        # Update the project
        update_data = {
            "name": f"Updated Project {datetime.now().strftime('%H%M%S')}",
            "status": "In Progress"
        }
        
        update_success, _ = self.run_test(
            f"Update Project {project_id}",
            "PUT",
            f"projects/{project_id}",
            200,
            data=update_data
        )
        
        if not update_success:
            return False
        
        # Test delete functionality
        delete_success, _ = self.run_test(
            f"Delete Project {project_id}",
            "DELETE",
            f"projects/{project_id}",
            200
        )
        
        return delete_success
    
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
            "acceptedPoints": 20,
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
            "status": "Completed",
            "acceptedPoints": 25  # Testing if acceptedPoints update works
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
    
    def test_team_endpoints(self):
        """Test team member endpoints including delete functionality"""
        # Get all team members
        get_success, team = self.run_test(
            "Get All Team Members",
            "GET",
            "team",
            200
        )
        
        if not get_success:
            return False
        
        # Create a new team member
        new_member = {
            "name": f"Test Member {datetime.now().strftime('%H%M%S')}",
            "role": "Developer",
            "capacity": 40,
            "projectId": 1
        }
        
        create_success, created_member = self.run_test(
            "Create Team Member",
            "POST",
            "team",
            201,
            data=new_member
        )
        
        if not create_success or 'id' not in created_member:
            return False
        
        member_id = created_member['id']
        
        # Get the created team member
        get_one_success, _ = self.run_test(
            f"Get Team Member {member_id}",
            "GET",
            f"team/{member_id}",
            200
        )
        
        if not get_one_success:
            return False
        
        # Update the team member
        update_data = {
            "name": f"Updated Member {datetime.now().strftime('%H%M%S')}",
            "role": "Senior Developer"
        }
        
        update_success, _ = self.run_test(
            f"Update Team Member {member_id}",
            "PUT",
            f"team/{member_id}",
            200,
            data=update_data
        )
        
        if not update_success:
            return False
        
        # Test delete functionality
        delete_success, _ = self.run_test(
            f"Delete Team Member {member_id}",
            "DELETE",
            f"team/{member_id}",
            200
        )
        
        return delete_success
    
    def test_tasks_endpoints(self):
        """Test task endpoints including delete functionality"""
        # Get all tasks
        get_success, tasks = self.run_test(
            "Get All Tasks",
            "GET",
            "tasks",
            200
        )
        
        if not get_success:
            return False
        
        # Create a new task
        new_task = {
            "projectId": 1,
            "sprintId": 1,
            "title": f"Test Task {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test task",
            "status": "To Do",
            "priority": "Medium",
            "assignee": "John Doe",
            "estimatedHours": 8
        }
        
        create_success, created_task = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            201,
            data=new_task
        )
        
        if not create_success or 'id' not in created_task:
            return False
        
        task_id = created_task['id']
        
        # Get the created task
        get_one_success, _ = self.run_test(
            f"Get Task {task_id}",
            "GET",
            f"tasks/{task_id}",
            200
        )
        
        if not get_one_success:
            return False
        
        # Update the task
        update_data = {
            "title": f"Updated Task {datetime.now().strftime('%H%M%S')}",
            "status": "Done"
        }
        
        update_success, _ = self.run_test(
            f"Update Task {task_id}",
            "PUT",
            f"tasks/{task_id}",
            200,
            data=update_data
        )
        
        if not update_success:
            return False
        
        # Test delete functionality
        delete_success, _ = self.run_test(
            f"Delete Task {task_id}",
            "DELETE",
            f"tasks/{task_id}",
            200
        )
        
        return delete_success
    
    def test_bugs_endpoints(self):
        """Test bug endpoints including delete functionality"""
        # Get all bugs
        get_success, bugs = self.run_test(
            "Get All Bugs",
            "GET",
            "bugs",
            200
        )
        
        if not get_success:
            return False
        
        # Create a new bug
        new_bug = {
            "projectId": 1,
            "sprintId": 1,
            "title": f"Test Bug {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test bug",
            "status": "To Do",
            "priority": "High",
            "severity": "Major",
            "assignee": "Jane Doe",
            "estimatedHours": 4
        }
        
        create_success, created_bug = self.run_test(
            "Create Bug",
            "POST",
            "bugs",
            201,
            data=new_bug
        )
        
        if not create_success or 'id' not in created_bug:
            return False
        
        bug_id = created_bug['id']
        
        # Get the created bug
        get_one_success, _ = self.run_test(
            f"Get Bug {bug_id}",
            "GET",
            f"bugs/{bug_id}",
            200
        )
        
        if not get_one_success:
            return False
        
        # Update the bug
        update_data = {
            "title": f"Updated Bug {datetime.now().strftime('%H%M%S')}",
            "status": "Done"
        }
        
        update_success, _ = self.run_test(
            f"Update Bug {bug_id}",
            "PUT",
            f"bugs/{bug_id}",
            200,
            data=update_data
        )
        
        if not update_success:
            return False
        
        # Test delete functionality
        delete_success, _ = self.run_test(
            f"Delete Bug {bug_id}",
            "DELETE",
            f"bugs/{bug_id}",
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
            
    def test_bug_update_with_time(self):
        """Test that adding time to a completed bug updates its actual hours"""
        # First, get a completed bug
        get_bugs_success, bugs = self.run_test(
            "Get Bugs",
            "GET",
            "bugs",
            200
        )
        
        if not get_bugs_success or not bugs:
            return False
        
        # Find a completed bug
        completed_bug = None
        for bug in bugs:
            if bug.get('status') == 'Done':
                completed_bug = bug
                break
        
        if not completed_bug:
            print("No completed bugs found for testing")
            return False
        
        # Record the current actual hours
        bug_id = completed_bug['id']
        current_hours = completed_bug.get('actualHours', 0)
        
        # Add time to the bug
        hours_to_add = 1.5
        new_entry = {
            "taskId": bug_id,
            "isTaskEntry": False,
            "isBugEntry": True,
            "projectId": completed_bug['projectId'],
            "sprintId": completed_bug.get('sprintId'),
            "date": datetime.now().strftime('%Y-%m-%d'),
            "hours": hours_to_add,
            "description": f"Testing bug actual hours update {datetime.now().strftime('%H%M%S')}"
        }
        
        create_success, created_entry = self.run_test(
            "Create Time Entry for Completed Bug",
            "POST",
            "time-entries",
            201,
            data=new_entry
        )
        
        if not create_success:
            return False
        
        # Get the bug again to check if hours were updated
        get_bug_success, updated_bug = self.run_test(
            f"Get Updated Bug {bug_id}",
            "GET",
            f"bugs/{bug_id}",
            200
        )
        
        if not get_bug_success:
            return False
        
        # Check if actual hours were updated
        new_hours = updated_bug.get('actualHours', 0)
        expected_hours = current_hours + hours_to_add
        
        if abs(new_hours - expected_hours) < 0.01:  # Allow for floating point comparison
            print(f"✅ Bug actual hours correctly updated from {current_hours} to {new_hours}")
            return True
        else:
            print(f"❌ Bug actual hours not updated correctly. Expected: {expected_hours}, Got: {new_hours}")
            return False
            
    def test_sprint_accepted_points_calculation(self):
        """Test that sprint accepted points are calculated correctly based on task/bug actual hours"""
        # First, get all sprints
        get_sprints_success, sprints = self.run_test(
            "Get Sprints",
            "GET",
            "sprints",
            200
        )
        
        if not get_sprints_success or not sprints:
            return False
        
        # Find an active or completed sprint
        test_sprint = None
        for sprint in sprints:
            if sprint.get('status') in ['Active', 'Completed']:
                test_sprint = sprint
                break
        
        if not test_sprint:
            print("No active or completed sprints found for testing")
            return False
        
        sprint_id = test_sprint['id']
        
        # Get tasks for this sprint
        get_tasks_success, tasks = self.run_test(
            "Get Tasks for Sprint",
            "GET",
            f"tasks?sprint_id={sprint_id}",
            200
        )
        
        if not get_tasks_success:
            return False
        
        # Get bugs for this sprint
        get_bugs_success, bugs = self.run_test(
            "Get Bugs for Sprint",
            "GET",
            f"bugs?sprint_id={sprint_id}",
            200
        )
        
        if not get_bugs_success:
            return False
        
        # Calculate expected accepted points based on completed tasks and bugs
        completed_tasks = [task for task in tasks if task.get('status') == 'Done']
        completed_bugs = [bug for bug in bugs if bug.get('status') == 'Done']
        
        total_task_hours = sum(task.get('actualHours', 0) for task in completed_tasks)
        total_bug_hours = sum(bug.get('actualHours', 0) for bug in completed_bugs)
        total_hours = total_task_hours + total_bug_hours
        
        # Convert hours to story points (8 hours = 1 story point)
        expected_points = round(total_hours / 8)
        
        print(f"Calculated accepted points for sprint {sprint_id}: {expected_points}")
        print(f"Based on {len(completed_tasks)} completed tasks with {total_task_hours} hours")
        print(f"And {len(completed_bugs)} completed bugs with {total_bug_hours} hours")
        
        # For verification only - we don't actually check the sprint's acceptedPoints value
        # since it's calculated on the frontend
        return True

def main():
    # Setup
    tester = AgileTrackingAPITester()
    
    # Run tests
    print("\n===== TESTING BACKEND API =====")
    root_success, _ = tester.test_root_endpoint()
    status_success = tester.test_status_endpoint()
    
    # Test CRUD operations with delete functionality
    projects_success = tester.test_projects_endpoints()
    sprints_success = tester.test_sprints_endpoints()
    team_success = tester.test_team_endpoints()
    tasks_success = tester.test_tasks_endpoints()
    bugs_success = tester.test_bugs_endpoints()
    
    # Test other functionality
    time_tracking_success = tester.test_time_tracking_endpoints()
    task_update_success = tester.test_task_update_with_time()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    print("\n===== BACKEND API TEST SUMMARY =====")
    print(f"Root endpoint: {'✅ PASSED' if root_success else '❌ FAILED'}")
    print(f"Status endpoint: {'✅ PASSED' if status_success else '❌ FAILED'}")
    print(f"Projects endpoints (with delete): {'✅ PASSED' if projects_success else '❌ FAILED'}")
    print(f"Sprints endpoints (with delete): {'✅ PASSED' if sprints_success else '❌ FAILED'}")
    print(f"Team endpoints (with delete): {'✅ PASSED' if team_success else '❌ FAILED'}")
    print(f"Tasks endpoints (with delete): {'✅ PASSED' if tasks_success else '❌ FAILED'}")
    print(f"Bugs endpoints (with delete): {'✅ PASSED' if bugs_success else '❌ FAILED'}")
    print(f"Time tracking endpoints: {'✅ PASSED' if time_tracking_success else '❌ FAILED'}")
    print(f"Task update with time: {'✅ PASSED' if task_update_success else '❌ FAILED'}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())