EduMentor AI – Multi-Agent Learning \& Assessment Platform

Project Overview

Build a learning and assessment platform where students upload educational PDF documents, generate quizzes from the document content, answer questions, receive automated evaluations, and obtain personalized study recommendations based on quiz performance.

The platform demonstrates an agent-based workflow through multiple cooperating agents that process uploaded learning material, generate assessments, evaluate responses, and recommend study plans.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

1\. Tech Stack

Frontend

•	React

•	TypeScript

•	Vite

•	Tailwind CSS

•	Recharts

•	Lucide React

Backend

•	Supabase Authentication

•	Supabase PostgreSQL

•	Supabase Storage

Testing

•	Vitest

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

2\. User Roles

Admin

Can:

•	View users

•	View uploaded PDFs

•	View quiz statistics

•	Monitor agent activity

•	Manage platform data

Student

Can:

•	Upload PDFs

•	Generate quizzes

•	Attempt quizzes

•	View quiz history

•	View study plans

•	Track performance

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

3\. Agent-Based Architecture

Create a central workflow coordinating three agents.

Question Generation Agent

Responsibilities:

•	Read extracted PDF text

•	Identify important sentences

•	Generate fill-in-the-blank questions

•	Generate keyword-based questions

Question Types:

•	Fill in the Blank

•	Keyword Questions

•	Short Answer

Difficulty Levels:

•	Easy

•	Medium

•	Hard

Evaluation Agent

Responsibilities:

•	Compare answers against generated keywords

•	Assign scores

•	Generate feedback

•	Identify mistakes

Output Example:

Score: 8/10

•	Strong understanding of the topic.

•	Some important keywords were missing.

•	Review the highlighted concepts.

Study Planner Agent

Responsibilities:

•	Analyze quiz performance

•	Detect weak topics

•	Generate personalized study plans

•	Recommend revision activities

Output Example:

Weak Topics:

•	Memory Management

•	Process Scheduling

Recommended Plan:

Day 1:Review Memory Management

Day 2:Practice Scheduling Questions

Day 3:Revision Quiz

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

4\. Authentication

Implement:

•	Email Signup

•	Email Login

•	Forgot Password

•	Logout

Using: Supabase Authentication

Requirements:

•	Create profile after signup

•	Protect application routes

•	Redirect unauthenticated users to /login

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



5\. Global Design System

Colors

Background:#000000

Cards:#111111

Primary:#00E676

Text Primary:#FFFFFF

Text Secondary:#9CA3AF

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Components

Cards:Rounded Corners, Subtle Glow, Hover Elevation

Buttons:Primary Green Theme, Bold Text, Hover Scale

Animations

Create:fadeIn, slideUp, scaleIn, countUp, glowPulse, successBounce

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

6\. Landing Page

Hero Title:

Learn Smarter with Agent-Based Assessment

Subtitle:

•	PDF Learning

•	AI Quiz Generation

•	AI Assessment

•	Personalized Study Plans.

CTA Buttons:

•	Login

•	Get Started

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

7\. Navigation

Desktop:Left Sidebar

Routes:

•	/

•	/login

•	/dashboard

•	/library

•	/quiz

•	/results

•	/study-plan

•	/profile

•	/admin

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

8\. Dashboard

Display:

•	Total PDFs

•	Quizzes Attempted

•	Average Score

•	Recent Activity

Cards:

•	PDF Count

•	Quiz Count

•	Best Score

•	Overall Accuracy

•	Display a simple insight generated from quiz performance.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

9\. PDF Library Module

Route:/library

Features:

•	Upload PDF

•	View PDF List

•	Delete PDF

•	Search PDFs

Store files using: Supabase Storage

Display:

•	File Name

•	Upload Date

•	Generated Question Count

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

10\. Quiz Generation Module

Route:

/quiz

Workflow:

Select PDF -> Choose Difficulty -> Choose Number of Questions -> Generate Quiz

Question Count Options:

1)5                                2) 10                                  3)15                                4) 20

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

11\. Quiz Attempt Module

Features:

•	Timer

•	Question Navigation

•	Progress Indicator

•	Submit Quiz

Supported Questions:

•	Fill in the Blank

•	Keyword Questions

•	Short Answer

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

12\. Evaluation Module

After submission:

Evaluation Agent should:

•	Check answers

•	Assign marks

•	Generate feedback

•	Calculate accuracy

Display:

•	Total Score

•	Correct Answers

•	Incorrect Answers

•	Accuracy Percentage

•	Feedback

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

13\. Results Page

Route: /results

Display:

•	Quiz History

•	Previous Attempts

•	Scores

•	Strong Topics

•	Weak Topics

Charts:

•	Score Trend

•	Topic Accuracy

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

14\. Study Plan Page

Route: /study-plan

Generated by: Study Planner Agent

Display:

•	Weak Topics

•	Recommended Tasks

•	Study Goals

•	Revision Suggestions

Allow students to: Track completed tasks

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

15\. Profile Page

Editable:

•	Name

•	Phone

Read Only:

•	Email

•	Username

Display:

•	Total Quizzes

•	Average Score

•	Best Score

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

16\. Admin Panel

Route:

/admin

Admin Only.

Users Tab

Display:

•	Registered Students

•	Registration Dates

•	Quiz Attempts

Analytics Tab

Display:

•	Total Users

•	Total PDFs

•	Total Quiz Attempts

•	Average Score

Agent Monitoring Tab

Display:

•	Question Generations

•	Evaluations

•	Study Plans Generated

•	Agent Logs

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

17\. Database Tables

Create:

•	profiles

•	user\_roles

•	pdf\_documents

•	generated\_questions

•	quiz\_attempts

•	quiz\_answers

•	quiz\_results

•	study\_plans

•	agent\_logs

•	audit\_logs

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

18\. Security Requirements

Requirements:

•	Enable RLS on all tables

•	Students access only their own data

•	Admins access all platform data

•	Protect private routes

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

19\. Agent Logs

Track:

•	Agent Name

•	Action

•	Execution Time

•	Status

•	Timestamp

•	Summary

Store in: agent\_logs

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

20\. Analytics

Display:

•	Average Score

•	Best Performing Topic

•	Weakest Topic

•	Accuracy Trend

Use:

Recharts for visual reports.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

21\. Deployment

Frontend:    Vercel

Backend:  Supabase

Requirements:

•	Responsive Design

•	Protected Routes

•	Environment Variables

•	Production Build Success

•	No Console Errors

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Final Goal

Build EduMentor AI, an Agent-Based Learning \& Assessment Platform where students upload PDF study materials, generate quizzes from extracted content, receive automated evaluations, track performance, and obtain personalized study plans. The platform demonstrates agent-oriented workflow through a Question Generation Agent, Evaluation Agent, and Study Planner Agent working together to support learning and self-assessment.





