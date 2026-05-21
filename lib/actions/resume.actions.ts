"use server";

import Education from "../models/education.model";
import Experience from "../models/experience.model";
import Resume from "../models/resume.model";
import Skill from "../models/skill.model";
import { connectToDB } from "../mongoose";
import { revalidatePath } from "next/cache";

export async function createResume({
  resumeId,
  userId,
  title,
}: {
  resumeId: string;
  userId: string;
  title: string;
}) {
  try {
    await connectToDB();

    const newResume = await Resume.create({
      resumeId,
      userId,
      title,
    });

    return { success: true, data: JSON.stringify(newResume) };
  } catch (error: any) {
    console.error(`Failed to create resume: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function fetchResume(resumeId: string) {
  try {
    await connectToDB();

    const resume = await Resume.findOne({ resumeId: resumeId })
      .populate({
        path: "experience",
        model: Experience,
      })
      .populate({
        path: "education",
        model: Education,
      })
      .populate({
        path: "skills",
        model: Skill,
      });

    return JSON.stringify(resume);
  } catch (error: any) {
    throw new Error(`Failed to fetch resume: ${error.message}`);
  }
}

export async function fetchUserResumes(userId: string) {
  if (userId === "") {
    return [];
  }

  try {
    await connectToDB();

    const resumes = await Resume.find({ userId: userId });

    return JSON.stringify(resumes);
  } catch (error: any) {
    // #region agent log
    fetch("http://127.0.0.1:7830/ingest/c357e084-9847-4c11-997e-68e2cfaa8db9", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "467421",
      },
      body: JSON.stringify({
        sessionId: "467421",
        location: "lib/actions/resume.actions.ts:fetchUserResumes",
        message: "fetchUserResumes failed",
        data: { errorMessage: error.message },
        hypothesisId: "H1",
        timestamp: Date.now(),
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    throw new Error(`Failed to fetch user resumes: ${error.message}`);
  }
}

export async function checkResumeOwnership(userId: string, resumeId: string) {
  if (userId === "") {
    return false;
  }

  try {
    await connectToDB();

    const resume = await Resume.findOne({ resumeId: resumeId, userId: userId });

    return resume ? true : false;
  } catch (error: any) {
    throw new Error(`Failed to check resume ownership: ${error.message}`);
  }
}

export async function updateResume({
  resumeId,
  updates,
}: {
  resumeId: string;
  updates: Partial<{
    firstName: string;
    lastName: string;
    jobTitle: string;
    address: string;
    phone: string;
    email: string;
    summary: string;
    themeColor: string;
  }>;
}) {
  try {
    await connectToDB();

    const resume = await Resume.findOne({ resumeId: resumeId });

    if (!resume) {
      return { success: false, error: "Resume not found" };
    }

    Object.keys(updates).forEach((key) => {
      const updateValue = updates[key as keyof typeof updates];

      if (updateValue !== undefined) {
        resume[key as keyof typeof updates] = updateValue;
      }
    });

    resume.updatedAt = new Date();

    const updatedResume = await resume.save();

    return { success: true, data: JSON.stringify(updatedResume) };
  } catch (error: any) {
    console.error(`Failed to update resume: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function addExperienceToResume(
  resumeId: string,
  experienceDataArray: any
) {
  try {
    await connectToDB();

    const resume = await Resume.findOne({ resumeId: resumeId });

    if (!resume) {
      throw new Error("Resume not found");
    }

    const savedExperiences = await Promise.all(
      experienceDataArray.map(async (experienceData: any) => {
        if (experienceData._id) {
          const existingExperience = await Experience.findById(
            experienceData._id
          );
          if (existingExperience) {
            return await Experience.findByIdAndUpdate(
              experienceData._id,
              experienceData,
              { new: true }
            );
          }
        }
        const newExperience = new Experience(experienceData);
        return await newExperience.save();
      })
    );

    const experienceIds = savedExperiences.map((experience) => experience._id);
    resume.experience = experienceIds;

    const updatedResume = await resume.save();

    return { success: true, data: JSON.stringify(updatedResume) };
  } catch (error: any) {
    console.error("Error adding or updating experience to resume: ", error);
    return { success: false, error: error?.message };
  }
}

export async function addEducationToResume(
  resumeId: string,
  educationDataArray: any
) {
  try {
    await connectToDB();

    const resume = await Resume.findOne({ resumeId: resumeId });

    if (!resume) {
      throw new Error("Resume not found");
    }

    const savedEducation = await Promise.all(
      educationDataArray.map(async (educationData: any) => {
        if (educationData._id) {
          const existingEducation = await Education.findById(educationData._id);
          if (existingEducation) {
            return await Education.findByIdAndUpdate(
              educationData._id,
              educationData,
              { new: true }
            );
          }
        }
        const newEducation = new Education(educationData);
        return await newEducation.save();
      })
    );

    const educationIds = savedEducation.map((education) => education._id);
    resume.education = educationIds;

    const updatedResume = await resume.save();

    return { success: true, data: JSON.stringify(updatedResume) };
  } catch (error: any) {
    console.error("Error adding or updating education to resume: ", error);
    return { success: false, error: error?.message };
  }
}

export async function addSkillToResume(
  resumeId: string,
  skillDataArray: any
) {
  try {
    await connectToDB();

    const resume = await Resume.findOne({ resumeId: resumeId });

    if (!resume) {
      throw new Error("Resume not found");
    }

    const savedSkills = await Promise.all(
      skillDataArray.map(async (skillData: any) => {
        if (skillData._id) {
          const existingSkill = await Skill.findById(skillData._id);
          if (existingSkill) {
            return await Skill.findByIdAndUpdate(skillData._id, skillData, {
              new: true,
            });
          }
        }
        const newSkill = new Skill(skillData);
        return await newSkill.save();
      })
    );

    const skillIds = savedSkills.map((skill) => skill._id);
    resume.skills = skillIds;

    const updatedResume = await resume.save();

    return { success: true, data: JSON.stringify(updatedResume) };
  } catch (error: any) {
    console.error("Error adding or updating skill to resume: ", error);
    return { success: false, error: error?.message };
  }
}

export async function deleteResume(resumeId: string, path: string) {
  try {
    await connectToDB();

    await Resume.findOneAndDelete({ resumeId: resumeId });

    revalidatePath(path);

    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete resume: ${error.message}`);
    return { success: false, error: error.message };
  }
}
