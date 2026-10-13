import { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (!userId || !teamId || typeof type !== 'string' || !type.trim() || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Activity requires userId, teamId, type, and a positive minutes value'), { status: 400 });
  }

  if (!isValidObjectId(userId) || !isValidObjectId(teamId)) {
    throw Object.assign(new Error('Activity userId and teamId must be valid Mongo ObjectIds'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);

  if (!user || !team) {
    throw Object.assign(new Error('Activity references must point to existing users and teams'), { status: 400 });
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: Math.max(1, Math.round(minutes)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team requires name and mascot'), { status: 400 });
  }

  const normalizedMembers = Array.isArray(members) ? members : [];
  if (normalizedMembers.some((member) => typeof member !== 'string' || !isValidObjectId(member))) {
    throw Object.assign(new Error('Team members must be valid Mongo ObjectIds'), { status: 400 });
  }

  const uniqueMembers = [...new Set(normalizedMembers)];
  if (uniqueMembers.length > 0) {
    const existingUsers = await User.find({ _id: { $in: uniqueMembers } }).select('_id');
    if (existingUsers.length !== uniqueMembers.length) {
      throw Object.assign(new Error('Team members must reference existing users'), { status: 400 });
    }
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: uniqueMembers,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'teamDetails' } },
    { $project: {
        _id: 0,
        teamName: { $ifNull: [{ $arrayElemAt: ['$teamDetails.name', 0] }, 'Unknown Team'] },
        totalPoints: 1,
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  if (!userEmail || typeof userEmail !== 'string' || !userEmail.trim()) {
    throw Object.assign(new Error('A valid user email is required'), { status: 400 });
  }

  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('Unknown user email'), { status: 400 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const recentType = recentActivities[0]?.type ?? user.fitnessGoal ?? 'endurance';
  const focus = (user.fitnessGoal && typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim()) ? user.fitnessGoal.trim() : recentType;

  const matchingWorkouts = await Workout.find({ focus }).lean();
  const suggestions = matchingWorkouts.length > 0 ? matchingWorkouts : await Workout.find().lean();

  return suggestions.map((workout) => ({
    ...workout,
    reason: `Your recent ${recentType} activity suggests a ${focus} workout pattern.`,
  }));
}

export { User };
