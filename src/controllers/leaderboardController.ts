import { RequestHandler } from 'express';
import prisma from '../util/prisma'; // Adjust according to your project structure
import { assertHasUser } from '../util/assertHasUser';

export const leaderboard: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req); // Ensure the user is authenticated
    const user = req.user; // Get the authenticated user from the request
    // Fetch all clinic scores along with associated clinic and disease
    const clinicScores = await prisma.clinicScore.findMany({
      include: {
        clinic: true,
        disease: true,
      },
    });

    // Calculate the average values
    const clinicScoresWithAverages = clinicScores.map(score => {
      const avgPromScore = score.totalCases > 0 ? score.totalPromScore / score.totalCases : null;
      const avgDays = score.totalCases > 0 ? score.totalDays / score.totalCases : null;
      const avgCost = score.totalCases > 0 ? score.totalCost / score.totalCases : null;

      return {
        ...score,
        avgPromScore,
        avgDays,
        avgCost,
      };
    });

    // Sort the clinic scores by total cases resolved (descending order)
    clinicScoresWithAverages.sort((a, b) => b.totalCases - a.totalCases);

    // Render the view with the clinic scores
    res.render('leaderboard/index', { clinicScores: clinicScoresWithAverages, title: 'Leaderboard', user });
  } catch (error) {
    next(error);
  }
};
