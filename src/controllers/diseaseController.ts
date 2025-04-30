import { RequestHandler } from "express";
import prisma from "../util/prisma"; // Assuming you are using Prisma as your ORM
import { assertHasUser } from "../util/assertHasUser";

// Show the form for creating a new disease
export const showNewDiseaseFormPage: RequestHandler = (req, res) => {
    assertHasUser(req);
    const user = req.user;

    console.log(user);

    res.render("diseases/new", { title: "New Diseases", user, messages: res.locals.messages}); // Adjust to your EJS path
};

// Create a new disease
export const createNewDisease: RequestHandler = async (req, res) => {
  try {
    const { name, promName, questions } = req.body;

    console.log("Received data:", req.body);
    
    const formattedQuestions = questions.map((q: string) => ({
      question: q,
    }));

    console.log("Formatted questions:", formattedQuestions);

    const newDisease = await prisma.disease.create({
        data: {
          name
        },
      });

      const newProm = await prisma.prom.create({
        data: {
          name: promName,  // You can change this based on how you get the name for the PROM form
          questions: formattedQuestions, // Assume this comes as a JSON object
          diseaseId: newDisease.id, // Link the Prom to the new disease
        },
      });

    res.redirect("/diseases"); // Redirect to the diseases list or appropriate page
  } catch (error) {
    req.flash("error", "Failed to create disease. Please try again.");
    res.status(500).redirect("/diseases/new"); // Redirect to the new disease form on error
  }
};

// Get all diseases
export const getAllDiseases: RequestHandler = async (req, res) => {
  try {
    assertHasUser(req);
    const user = req.user;
    const diseases = await prisma.disease.findMany({
        include: {
          prom: true, // Include the associated PROM form data
        },
      });

    res.render("diseases/index", { diseases, user, title: "Diseases" }); // Adjust to your EJS path
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong!");
  }
};

// Get a specific disease by ID
export const getEditDiseaseFormById: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    assertHasUser(req);
    const user = req.user;
    const disease = await prisma.disease.findUnique({
        where: { id },
        include: {
          prom: true, // Include the associated PROM form data
        },
      });

    if (!disease) {
      res.status(404).send("Disease not found");
    }

    res.render("diseases/edit", { user, disease, title: "Edit Disease"}); // Adjust to your EJS path
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong!");
  }
};

// Update an existing disease
export const updateDisease: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { name, promName, questions } = req.body;

  try {
    // Update the disease name
    const updatedDisease = await prisma.disease.update({
      where: { id },
      data: {
        name,  // Only updating the name here
      },
    });

    // Format the PROM questions in the same way as the create function
    const formattedQuestions = questions ? questions.map((q: string) => ({ question: q })) : [];

    // Check if the disease has an existing PROM
    const existingProm = await prisma.prom.findUnique({
      where: { diseaseId: id },
    });

    if (existingProm) {
      // If the PROM exists, update it
      await prisma.prom.update({
        where: { diseaseId: id },
        data: {
          name: promName || existingProm.name, // If no new PROM name, keep the existing one
          questions: formattedQuestions.length > 0 ? formattedQuestions : existingProm.questions, // If no new questions, keep the existing ones
        },
      });
    } else {
      // If no PROM exists, create a new one
      await prisma.prom.create({
        data: {
          name: promName, // The new PROM name
          questions: formattedQuestions, // The formatted questions
          diseaseId: id,  // Link the new PROM to the existing disease
        },
      });
    }

    // After successful update, redirect to the disease page
    req.flash("success", "Disease updated successfully!");
    res.redirect(`/diseases/${id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong!");
  }
};


// Delete a disease
export const deleteDisease: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction([
        // Delete the associated Prom form
        prisma.prom.delete({
          where: { diseaseId: id },
        }),
        // Delete the disease
        prisma.disease.delete({
          where: { id },
        }),
      ]);

    res.redirect("/diseases"); // Redirect to the diseases list
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong!");
  }
};
