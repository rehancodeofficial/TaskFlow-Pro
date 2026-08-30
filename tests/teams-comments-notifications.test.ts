import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/db';
import { WorkspaceService } from '../lib/services/workspace.service';
import { ProjectService } from '../lib/services/project.service';
import { TaskService } from '../lib/services/task.service';
import { TeamService } from '../lib/services/team.service';
import { CommentService } from '../lib/services/comment.service';
import { NotificationService } from '../lib/services/notification.service';
import { ActivityService } from '../lib/services/activity.service';
import { hashPassword } from '../lib/auth';

describe('Teams, Comments, Activity Feed, and Notifications Tests', () => {
  let userOwner: any;
  let userMember: any;
  let userViewer: any;
  let workspace: any;
  let project: any;
  let task: any;
  let team: any;

  beforeAll(async () => {
    const pwd = await hashPassword('password123');
    userOwner = await prisma.user.create({
      data: { email: 'owner@tc.com', password: pwd, name: 'Owner User' },
    });
    userMember = await prisma.user.create({
      data: { email: 'member@tc.com', password: pwd, name: 'Member User' },
    });
    userViewer = await prisma.user.create({
      data: { email: 'viewer@tc.com', password: pwd, name: 'Viewer User' },
    });

    workspace = await WorkspaceService.createWorkspace(userOwner.id, { name: 'Collaboration WS' });

    // Join member and viewer to workspace
    await prisma.workspaceMember.createMany({
      data: [
        { workspaceId: workspace.id, userId: userMember.id, role: 'MEMBER' },
        { workspaceId: workspace.id, userId: userViewer.id, role: 'VIEWER' },
      ],
    });

    project = await ProjectService.createProject(userOwner.id, workspace.id, { name: 'Collab Project' });
    task = await TaskService.createTask(userOwner.id, workspace.id, project.id, { title: 'Collaboration Task' });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['owner@tc.com', 'member@tc.com', 'viewer@tc.com'] } },
    });
    await prisma.workspace.deleteMany({ where: { id: workspace.id } });
  });

  describe('Team Management', () => {
    it('Owner can create a team', async () => {
      team = await TeamService.createTeam(userOwner.id, workspace.id, {
        name: 'Engineering Team',
        description: 'Building TaskFlow Pro',
      });
      expect(team.id).toBeDefined();
      expect(team.name).toBe('Engineering Team');
    });

    it('Viewer CANNOT create a team', async () => {
      await expect(
        TeamService.createTeam(userViewer.id, workspace.id, { name: 'Restricted Team' })
      ).rejects.toThrow('You do not have the required role');
    });

    it('Owner can add members and assign leads', async () => {
      const teamMember = await TeamService.addMember(
        userOwner.id,
        workspace.id,
        team.id,
        userMember.id,
        true // isLead
      );
      expect(teamMember.userId).toBe(userMember.id);
      expect(teamMember.isLead).toBe(true);

      const teamDetails = await TeamService.getTeam(userOwner.id, workspace.id, team.id);
      expect(teamDetails.members.length).toBe(1);
      expect(teamDetails.members[0].userId).toBe(userMember.id);
    });
  });

  describe('Task Assignment Notification', () => {
    it('Assigning a task creates a notification and an activity log', async () => {
      await TaskService.assignTask(userOwner.id, workspace.id, task.id, userMember.id);

      // Verify notification created
      const notifications = await NotificationService.getUserNotifications(userMember.id, workspace.id);
      expect(notifications.data.length).toBeGreaterThan(0);
      expect(notifications.data[0].type).toBe('TASK_ASSIGNED');
      expect(notifications.data[0].content).toContain('assigned you to task');

      // Verify activity log created
      const feed = await ActivityService.getActivityFeed(userOwner.id, workspace.id);
      expect(feed.data.length).toBeGreaterThan(0);
      const assignmentLog = feed.data.find((log) => log.action === 'TASK_ASSIGNED');
      expect(assignmentLog).toBeDefined();
      expect(assignmentLog?.actorId).toBe(userOwner.id);
    });
  });

  describe('Comments, Mentions, and Replies', () => {
    it('Can add a comment with user mentions and trigger notifications', async () => {
      // Format: @[Name](userId)
      const mentionText = `Hey @[Member User](${userMember.id}), please review this.`;
      const comment = await CommentService.createComment(
        userOwner.id,
        workspace.id,
        task.id,
        mentionText
      );

      expect(comment.id).toBeDefined();
      expect(comment.content).toBe(mentionText);

      // Verify comment mention record
      const mentionRecord = await prisma.commentMention.findFirst({
        where: { commentId: comment.id, userId: userMember.id },
      });
      expect(mentionRecord).not.toBeNull();

      // Verify notification triggered for the mentioned user
      const notifications = await NotificationService.getUserNotifications(userMember.id, workspace.id);
      const mentionNotification = notifications.data.find(
        (n) => n.type === 'COMMENT_MENTIONED'
      );
      expect(mentionNotification).toBeDefined();
      expect(mentionNotification?.content).toContain('mentioned you in a comment');
    });

    it('Replying to a comment triggers a reply notification to the parent author', async () => {
      // Find the previous comment
      const comments = await CommentService.getTaskComments(userOwner.id, workspace.id, task.id);
      const parentComment = comments[0];

      const reply = await CommentService.createComment(
        userMember.id,
        workspace.id,
        task.id,
        'Sure, looking now!',
        parentComment.id
      );

      expect(reply.parentId).toBe(parentComment.id);

      // Verify parent author (userOwner) receives a notification
      const ownerNotifications = await NotificationService.getUserNotifications(
        userOwner.id,
        workspace.id
      );
      const replyNotification = ownerNotifications.data.find(
        (n) => n.type === 'COMMENT_REPLY'
      );
      expect(replyNotification).toBeDefined();
      expect(replyNotification?.content).toContain('replied to your comment');
    });
  });

  describe('Activity Feed (Audit Logs)', () => {
    it('Logs are generated for task creation and updates', async () => {
      // Perform a task update to generate the log
      await TaskService.updateTask(userOwner.id, workspace.id, task.id, {
        status: 'IN_PROGRESS',
      });

      const feed = await ActivityService.getActivityFeed(userOwner.id, workspace.id);
      expect(feed.data.length).toBeGreaterThan(0);

      const creationLog = feed.data.find((log) => log.action === 'TASK_CREATED');
      expect(creationLog).toBeDefined();

      const updateLog = feed.data.find((log) => log.action === 'TASK_UPDATED');
      expect(updateLog).toBeDefined();
    });
  });
});
