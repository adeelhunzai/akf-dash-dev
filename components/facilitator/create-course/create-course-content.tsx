"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImageIcon, Check, Plus, X, Trash2, ChevronDown, PlayCircle, NotebookText, Newspaper, CircleHelp } from "lucide-react";

const steps = [
  { number: 1, title: "Basic Info", subtitle: "Course details" },
  { number: 2, title: "Curriculum", subtitle: "Modules & lessons" },
  { number: 3, title: "Content", subtitle: "Upload & settings" },
  { number: 4, title: "Assessment", subtitle: "Quizzes & certificates" },
  { number: 5, title: "Review", subtitle: "Publish course" },
];

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration: number;
  description: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  attempts: number;
  timeLimit: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export default function CreateCourseContent() {
  const [currentStep, setCurrentStep] = useState(1); // Start at step 1 (Basic Info)
  const [charCount, setCharCount] = useState(0);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isAddQuizOpen, setIsAddQuizOpen] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<string>("");

  // Step 1: Basic Info
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [courseLevel, setCourseLevel] = useState("");

  // Modules and Lessons
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("video");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");

  // Quizzes
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizPassingScore, setQuizPassingScore] = useState("70");
  const [quizAttempts, setQuizAttempts] = useState("3");
  const [quizTimeLimit, setQuizTimeLimit] = useState("30");

  const [modules, setModules] = useState<Module[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [contentTab, setContentTab] = useState<"upload" | "settings">("upload");
  const [courseVisibility, setCourseVisibility] = useState<"private" | "institution" | "public">("private");
  const [enrollmentType, setEnrollmentType] = useState<"open" | "invitation">("open");
  const [requireAllLessons, setRequireAllLessons] = useState(true);
  const [minimumScore, setMinimumScore] = useState("70");
  const [assessmentTab, setAssessmentTab] = useState<"quizzes" | "certificates">("quizzes");
  const [issueCertificate, setIssueCertificate] = useState(true);
  const [certificateTemplate, setCertificateTemplate] = useState("modern");
  const [certificateText, setCertificateText] = useState("This is to certify that [Student Name] has successfully completed the course [Course Title]...");
  const maxChars = 200;

  // Calculate completion status
  const hasBasicInfo = courseTitle.trim() !== "" && courseDescription.trim() !== "" && courseCategory !== "" && courseLevel !== "";
  const hasModules = modules.length > 0;
  const hasLessons = modules.some(module => module.lessons.length > 0);
  const hasContentSettings = true; // Settings are always configured with defaults
  const hasAssessment = quizzes.length > 0 || issueCertificate;

  const completionItems = [
    { label: 'Basic Information', completed: hasBasicInfo },
    { label: 'Course Modules', completed: hasModules },
    { label: 'Lessons Added', completed: hasLessons },
    { label: 'Content Settings', completed: hasContentSettings },
    { label: 'Assessment Setup', completed: hasAssessment }
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const totalCount = completionItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setCharCount(text.length);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddModule = () => {
    const newModule: Module = {
      id: Date.now().toString(),
      title: moduleTitle,
      description: moduleDescription,
      lessons: [],
    };
    setModules([...modules, newModule]);
    setIsAddModuleOpen(false);
    setModuleTitle("");
    setModuleDescription("");
  };

  const handleDeleteModule = (id: string) => {
    setModules(modules.filter(module => module.id !== id));
    // Also remove from expanded set if it was expanded
    const newExpanded = new Set(expandedModules);
    newExpanded.delete(id);
    setExpandedModules(newExpanded);
  };

  const toggleModuleExpand = (id: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedModules(newExpanded);
  };

  const openAddLessonDialog = (moduleId: string) => {
    setCurrentModuleId(moduleId);
    setIsAddLessonOpen(true);
  };

  const handleAddLesson = () => {
    if (!lessonTitle.trim() || !lessonDuration) return;

    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: lessonTitle,
      type: lessonType,
      duration: parseInt(lessonDuration),
      description: lessonDescription,
    };

    setModules(modules.map(module => {
      if (module.id === currentModuleId) {
        return {
          ...module,
          lessons: [...module.lessons, newLesson]
        };
      }
      return module;
    }));

    setIsAddLessonOpen(false);
    setLessonTitle("");
    setLessonType("video");
    setLessonDuration("");
    setLessonDescription("");
    setCurrentModuleId("");
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
        };
      }
      return module;
    }));
  };

  const handleAddQuiz = () => {
    if (!quizTitle.trim()) return;

    const newQuiz: Quiz = {
      id: Date.now().toString(),
      title: quizTitle,
      description: quizDescription,
      passingScore: parseInt(quizPassingScore),
      attempts: parseInt(quizAttempts),
      timeLimit: parseInt(quizTimeLimit),
    };

    setQuizzes([...quizzes, newQuiz]);
    setIsAddQuizOpen(false);
    setQuizTitle("");
    setQuizDescription("");
    setQuizPassingScore("70");
    setQuizAttempts("3");
    setQuizTimeLimit("30");
  };

  const handleDeleteQuiz = (id: string) => {
    setQuizzes(quizzes.filter(quiz => quiz.id !== id));
  };

  const getLessonIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <PlayCircle className="w-5 h-5 text-gray-400" />;
      case 'assignment':
        return <NotebookText className="w-5 h-5 text-gray-400" />;
      case 'article':
        return <Newspaper className="w-5 h-5 text-gray-400" />;
      case 'quiz':
        return <CircleHelp className="w-5 h-5 text-gray-400" />;
      default:
        return <PlayCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-6 bg-[#FAFAFA]">
      <div className="max-w-[1200px] mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create Course
          </h1>
          <p className="text-sm text-muted-foreground">
            Build and publish your course in 5 simple steps
          </p>
        </div>

        {/* Steps Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-4xl">
            {steps.map((step, index) => {
              const isCompleted = step.number < currentStep;
              const isActive = step.number === currentStep;
              
              return (
                <div key={step.number} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {/* Step Circle */}
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm mb-2 transition-colors ${
                          isCompleted || isActive
                            ? "bg-[#00B140] text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          step.number
                        )}
                      </div>
                      <div className="text-center">
                        <p
                          className={`text-sm font-medium mb-0.5 ${
                            isCompleted || isActive ? "text-[#00B140]" : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>
                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div 
                        className={`h-0.5 flex-1 -mt-12 mx-2 transition-colors ${
                          step.number < currentStep ? "bg-[#00B140]" : "bg-gray-200"
                        }`} 
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Basic Course Information
                </h2>

                <div className="space-y-6">
                  {/* Course Title */}
                  <div>
                    <Label htmlFor="courseTitle" className="text-sm font-medium mb-2 block">
                      Course Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="courseTitle"
                      placeholder="Enter course title"
                      className="w-full"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                    />
                  </div>

                  {/* Short Description */}
                  <div>
                    <Label htmlFor="shortDescription" className="text-sm font-medium mb-2 block">
                      Short Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="shortDescription"
                      placeholder="Brief description of the course (max 200 characters)"
                      className="w-full min-h-[100px] resize-none"
                      maxLength={maxChars}
                      onChange={(e) => {
                        const text = e.target.value;
                        if (text.length <= maxChars) {
                          setCourseDescription(text);
                          setCharCount(text.length);
                        }
                      }}
                      value={courseDescription}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {charCount}/{maxChars} characters
                    </p>
                  </div>

                  {/* Detailed Description */}
                  <div>
                    <Label htmlFor="detailedDescription" className="text-sm font-medium mb-2 block">
                      Detailed Description & Learning Outcomes
                    </Label>
                    <Textarea
                      id="detailedDescription"
                      placeholder="Detailed course description, what learners will achieve, prerequisites, etc."
                      className="w-full min-h-[150px] resize-none"
                    />
                  </div>

                  {/* Category and Level Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="category" className="text-sm font-medium mb-2 block">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Select value={courseCategory} onValueChange={setCourseCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="programming">Programming</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="level" className="text-sm font-medium mb-2 block">
                        Level <span className="text-red-500">*</span>
                      </Label>
                      <Select value={courseLevel} onValueChange={setCourseLevel}>
                        <SelectTrigger id="level">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Language and Thumbnail Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="language" className="text-sm font-medium mb-2 block">
                        Language <span className="text-red-500">*</span>
                      </Label>
                      <Select>
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="german">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Course Thumbnail
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer">
                        <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-foreground mb-1">
                          Click to upload thumbnail
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 3MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Curriculum Structure
                </h2>

                <div className="space-y-4">
                  {/* Display Added Modules */}
                  {modules.map((module, index) => {
                    const isExpanded = expandedModules.has(module.id);
                    
                    return (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                        {/* Module Card */}
                        <div className="bg-[#F9FAFB] rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Module Number Badge */}
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-semibold text-foreground">
                              {index + 1}
                            </div>
                            {/* Module Info */}
                            <div>
                              <h3 className="font-medium text-foreground">{module.title}</h3>
                              <p className="text-sm text-muted-foreground">{module.lessons.length} lessons</p>
                            </div>
                          </div>
                          {/* Action Icons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteModule(module.id)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => toggleModuleExpand(module.id)}
                              className="text-gray-500 hover:text-gray-600 transition-all p-1"
                            >
                              <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Lessons List - Only show when expanded */}
                        {isExpanded && (
                          <div className="space-y-3">
                            {/* Display Added Lessons */}
                            {module.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                  {getLessonIcon(lesson.type)}
                                  <div>
                                    <h4 className="font-medium text-sm text-foreground">{lesson.title}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {lesson.type} • {lesson.duration} min
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                  className="text-red-500 hover:text-red-600 transition-colors p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}

                            {/* Add Lesson Button */}
                            <div 
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer"
                              onClick={() => openAddLessonDialog(module.id)}
                            >
                              <button className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                                <Plus className="w-4 h-4" />
                                <span>Add Lesson</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Module Button */}
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => setIsAddModuleOpen(true)}
                  >
                    <button className="flex items-center gap-2 text-[#00B140] font-medium">
                      <Plus className="w-5 h-5" />
                      <span>Add Module</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Content & Settings
                </h2>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setContentTab("upload")}
                    className={`pb-3 font-medium text-sm transition-colors relative ${
                      contentTab === "upload"
                        ? "text-[#00B140]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Content Upload
                    {contentTab === "upload" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B140]" />
                    )}
                  </button>
                  <button
                    onClick={() => setContentTab("settings")}
                    className={`pb-3 font-medium text-sm transition-colors relative ${
                      contentTab === "settings"
                        ? "text-[#00B140]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Course Settings
                    {contentTab === "settings" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B140]" />
                    )}
                  </button>
                </div>

                {/* Content Upload Tab */}
                {contentTab === "upload" && (
                  <div className="space-y-6">
                    {modules.map((module) => (
                      <div key={module.id} className="space-y-3">
                        {/* Module Title */}
                        <h3 className="font-semibold text-foreground">{module.title}</h3>
                        
                        {/* Module Lessons */}
                        <div className="space-y-2">
                          {module.lessons.map((lesson) => (
                            <div 
                              key={lesson.id} 
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white"
                            >
                              <div className="flex items-center gap-3">
                                {getLessonIcon(lesson.type)}
                                <div>
                                  <h4 className="font-medium text-sm text-foreground">{lesson.title}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {lesson.type} • {lesson.duration} min
                                  </p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" className="px-4">
                                Upload Content
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {modules.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No modules added yet. Please add modules and lessons in the Curriculum step.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Course Settings Tab */}
                {contentTab === "settings" && (
                  <div className="space-y-8">
                    {/* Course Visibility */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Course Visibility</h3>
                      <div className="space-y-3">
                        {/* Private */}
                        <div 
                          className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors"
                          onClick={() => setCourseVisibility("private")}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {courseVisibility === "private" ? (
                                <div className="w-5 h-5 rounded-full border-2 border-[#00B140] flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#00B140]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Private</p>
                              <p className="text-sm text-muted-foreground">Only you can see this course</p>
                            </div>
                          </div>
                        </div>

                        {/* Institution Only */}
                        <div 
                          className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors"
                          onClick={() => setCourseVisibility("institution")}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {courseVisibility === "institution" ? (
                                <div className="w-5 h-5 rounded-full border-2 border-[#00B140] flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#00B140]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Institution Only</p>
                              <p className="text-sm text-muted-foreground">Visible to your institution members</p>
                            </div>
                          </div>
                        </div>

                        {/* Public */}
                        <div 
                          className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors"
                          onClick={() => setCourseVisibility("public")}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {courseVisibility === "public" ? (
                                <div className="w-5 h-5 rounded-full border-2 border-[#00B140] flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#00B140]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Public</p>
                              <p className="text-sm text-muted-foreground">Anyone can discover this course</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enrollment Type */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Enrollment Type</h3>
                      <div className="space-y-3">
                        {/* Open Enrollment */}
                        <div 
                          className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors"
                          onClick={() => setEnrollmentType("open")}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {enrollmentType === "open" ? (
                                <div className="w-5 h-5 rounded-full border-2 border-[#00B140] flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#00B140]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Open Enrollment</p>
                              <p className="text-sm text-muted-foreground">Anyone can enroll in this course</p>
                            </div>
                          </div>
                        </div>

                        {/* Invitation Only */}
                        <div 
                          className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors"
                          onClick={() => setEnrollmentType("invitation")}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {enrollmentType === "invitation" ? (
                                <div className="w-5 h-5 rounded-full border-2 border-[#00B140] flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#00B140]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Invitation Only</p>
                              <p className="text-sm text-muted-foreground">Students need an invitation to enroll</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Completion Rules */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Completion Rules</h3>
                      <div className="space-y-4">
                        {/* Checkbox */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setRequireAllLessons(!requireAllLessons)}
                            className="flex items-center justify-center w-5 h-5 rounded border-2 transition-colors"
                            style={{
                              borderColor: requireAllLessons ? '#00B140' : '#D1D5DB',
                              backgroundColor: requireAllLessons ? '#00B140' : 'transparent'
                            }}
                          >
                            {requireAllLessons && (
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            )}
                          </button>
                          <label className="font-medium text-foreground cursor-pointer" onClick={() => setRequireAllLessons(!requireAllLessons)}>
                            Students must complete all lessons
                          </label>
                        </div>

                        {/* Minimum Score */}
                        <div className="max-w-xs">
                          <Label htmlFor="minimumScore" className="text-sm font-medium mb-2 block">
                            Minimum Overall Score (%)
                          </Label>
                          <Input
                            id="minimumScore"
                            type="number"
                            value={minimumScore}
                            onChange={(e) => setMinimumScore(e.target.value)}
                            className="w-full"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {currentStep === 4 && (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Assessment & Completion
                </h2>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setAssessmentTab("quizzes")}
                    className={`pb-3 font-medium text-sm transition-colors relative ${
                      assessmentTab === "quizzes"
                        ? "text-[#00B140]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Quizzes
                    {assessmentTab === "quizzes" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B140]" />
                    )}
                  </button>
                  <button
                    onClick={() => setAssessmentTab("certificates")}
                    className={`pb-3 font-medium text-sm transition-colors relative ${
                      assessmentTab === "certificates"
                        ? "text-[#00B140]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Certificates
                    {assessmentTab === "certificates" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B140]" />
                    )}
                  </button>
                </div>

                {/* Quizzes Tab */}
                {assessmentTab === "quizzes" && (
                  <div>
                    {/* Display Added Quizzes */}
                    <div className="space-y-4 mb-4">
                      {quizzes.map((quiz) => (
                        <div key={quiz.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-foreground">{quiz.title}</h3>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                          <div className="flex items-center gap-6 text-sm">
                            <span className="text-muted-foreground">
                              Passing Score: <span className="font-medium text-foreground">{quiz.passingScore}%</span>
                            </span>
                            <span className="text-muted-foreground">
                              Attempts: <span className="font-medium text-foreground">{quiz.attempts}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Time Limit: <span className="font-medium text-foreground">{quiz.timeLimit} min</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Quiz Button */}
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => setIsAddQuizOpen(true)}
                    >
                      <button className="flex items-center gap-2 text-gray-500 font-medium">
                        <Plus className="w-5 h-5" />
                        <span>Add Quiz</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Certificates Tab */}
                {assessmentTab === "certificates" && (
                  <div className="space-y-6">
                    {/* Issue Certificate Checkbox */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIssueCertificate(!issueCertificate)}
                        className="flex items-center justify-center w-5 h-5 rounded border-2 transition-colors"
                        style={{
                          borderColor: issueCertificate ? '#00B140' : '#D1D5DB',
                          backgroundColor: issueCertificate ? '#00B140' : 'transparent'
                        }}
                      >
                        {issueCertificate && (
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        )}
                      </button>
                      <label className="font-medium text-foreground cursor-pointer" onClick={() => setIssueCertificate(!issueCertificate)}>
                        Issue certificate upon course completion
                      </label>
                    </div>

                    {issueCertificate && (
                      <>
                        {/* Certificate Template */}
                        <div>
                          <Label htmlFor="certificateTemplate" className="text-sm font-medium mb-2 block">
                            Certificate Template
                          </Label>
                          <Select value={certificateTemplate} onValueChange={setCertificateTemplate}>
                            <SelectTrigger id="certificateTemplate" className="max-w-xs">
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">Modern Template</SelectItem>
                              <SelectItem value="classic">Classic Template</SelectItem>
                              <SelectItem value="elegant">Elegant Template</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Custom Certificate Text */}
                        <div>
                          <Label htmlFor="certificateText" className="text-sm font-medium mb-2 block">
                            Custom Certificate Text
                          </Label>
                          <Textarea
                            id="certificateText"
                            value={certificateText}
                            onChange={(e) => setCertificateText(e.target.value)}
                            className="w-full min-h-[100px] resize-none"
                            placeholder="This is to certify that [Student Name] has successfully completed the course [Course Title]..."
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Use [Student Name] and [Course Title] as placeholders
                          </p>
                        </div>

                        {/* Certificate Preview */}
                        <div>
                          <h3 className="text-sm font-medium mb-3">Certificate Preview</h3>
                          <div className="border border-gray-200 rounded-lg p-8 bg-white">
                            <div className="text-center space-y-4">
                              <h2 className="text-2xl font-bold text-foreground">Certificate of Completion</h2>
                              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                                {certificateText}
                              </p>
                              <p className="text-xs text-muted-foreground mt-4">
                                Template: {certificateTemplate}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {currentStep === 5 && (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Review & Publish
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Course Information */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4">Course Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Title:</p>
                          <p className="font-medium">{courseTitle || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Description:</p>
                          <p className="text-sm">{courseDescription || 'Not set'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Category:</p>
                            <p className="text-sm capitalize">{courseCategory || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Level:</p>
                            <p className="text-sm capitalize">{courseLevel || 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Curriculum Overview */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4">Curriculum Overview</h3>
                      
                      {/* Stats Cards */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">{modules.length}</p>
                          <p className="text-sm text-muted-foreground">Modules</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {modules.reduce((total, module) => total + module.lessons.length, 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">Lessons</p>
                        </div>
                        <div className="bg-pink-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-pink-600">
                            {(modules.reduce((total, module) => 
                              total + module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0), 0) / 60).toFixed(1)}h
                          </p>
                          <p className="text-sm text-muted-foreground">Duration</p>
                        </div>
                      </div>

                      {/* Module List */}
                      <div className="space-y-2">
                        {modules.map((module, index) => (
                          <div key={module.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-[#00B140] text-white flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{module.title}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{module.lessons.length} lessons</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Course Settings */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4">Course Settings</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Visibility:</p>
                          <p className="text-sm">{courseVisibility}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Enrollment:</p>
                          <p className="text-sm">{enrollmentType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Schedule:</p>
                          <p className="text-sm">Fixed schedule</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Certificate:</p>
                          <p className="text-sm">{issueCertificate ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Assessments */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4">Assessments</h3>
                      <div className="bg-yellow-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-600">{quizzes.length}</p>
                        <p className="text-sm text-muted-foreground">Quizzes</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Sidebar */}
                  <div className="space-y-6">
                    {/* Completion Status */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4">Completion Status</h3>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm font-medium">{completedCount}/{totalCount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-[#00B140] h-2 rounded-full transition-all" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {completionItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {item.completed ? (
                              <div className="w-5 h-5 rounded-full bg-[#00B140] flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            )}
                            <span className={`text-sm ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview Course
                        </Button>
                        <Button variant="outline" className="w-full justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save as Draft
                        </Button>
                      </div>
                    </div>

                    {/* Ready to Publish */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4">Ready to Publish?</h3>
                      {completedCount === totalCount ? (
                        <>
                          <p className="text-sm text-[#00B140] font-medium mb-4">Course is ready to publish!</p>
                          <Button className="w-full bg-[#00B140] hover:bg-[#009636] text-white">
                            Publish Course
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-orange-600 font-medium mb-4">
                            Complete all sections to publish
                          </p>
                          <Button className="w-full" disabled>
                            Publish Course
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button 
                variant="ghost" 
                className="px-6"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="px-6">
                  Cancel
                </Button>
                <Button variant="outline" className="px-6">
                  Save as Draft
                </Button>
                <Button 
                  className="bg-[#00B140] hover:bg-[#009636] text-white px-6"
                  onClick={handleNext}
                  disabled={currentStep === 5}
                >
                  {currentStep === 2 ? "Next: Content & Settings" : 
                   currentStep === 3 ? "Next: Assessment" :
                   currentStep === 4 ? "Next: Review & Publish" :
                   currentStep === 5 ? "Publish Course" :
                   "Next: Curriculum"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Module Dialog */}
      <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add Module</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Module Title */}
            <div>
              <Label htmlFor="moduleTitle" className="text-sm font-medium mb-2 block">
                Module Title<span className="text-red-500">*</span>
              </Label>
              <Input
                id="moduleTitle"
                placeholder="Enter first name"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Module Description */}
            <div>
              <Label htmlFor="moduleDescription" className="text-sm font-medium mb-2 block">
                Module Description
              </Label>
              <Textarea
                id="moduleDescription"
                placeholder="Brief description of this module"
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
                className="w-full min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAddModuleOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddModule}
              className="bg-[#00B140] hover:bg-[#009636] text-white px-6"
              disabled={!moduleTitle.trim()}
            >
              Add Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Lesson</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Lesson Title */}
            <div>
              <Label htmlFor="lessonTitle" className="text-sm font-medium mb-2 block">
                Lesson Title<span className="text-red-500">*</span>
              </Label>
              <Input
                id="lessonTitle"
                placeholder="Enter lesson title"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Lesson Type */}
            <div>
              <Label htmlFor="lessonType" className="text-sm font-medium mb-2 block">
                Lesson Type<span className="text-red-500">*</span>
              </Label>
              <Select value={lessonType} onValueChange={setLessonType}>
                <SelectTrigger id="lessonType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="lessonDuration" className="text-sm font-medium mb-2 block">
                Duration (minutes)
              </Label>
              <Input
                id="lessonDuration"
                type="number"
                placeholder="10"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(e.target.value)}
                className="w-full"
                min="1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="lessonDesc" className="text-sm font-medium mb-2 block">
                Description
              </Label>
              <Textarea
                id="lessonDesc"
                placeholder="Brief description of this lesson"
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                className="w-full min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAddLessonOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddLesson}
              className="bg-[#00B140] hover:bg-[#009636] text-white px-6"
              disabled={!lessonTitle.trim() || !lessonDuration}
            >
              Add Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Quiz Dialog */}
      <Dialog open={isAddQuizOpen} onOpenChange={setIsAddQuizOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Quiz</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Quiz Title */}
            <div>
              <Label htmlFor="quizTitle" className="text-sm font-medium mb-2 block">
                Quiz Title<span className="text-red-500">*</span>
              </Label>
              <Input
                id="quizTitle"
                placeholder="Enter quiz title"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="quizDesc" className="text-sm font-medium mb-2 block">
                Description
              </Label>
              <Textarea
                id="quizDesc"
                placeholder="Brief description of this quiz"
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                className="w-full min-h-[100px] resize-none"
              />
            </div>

            {/* Three fields in a row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Passing Score */}
              <div>
                <Label htmlFor="passingScore" className="text-sm font-medium mb-2 block">
                  Passing Score (%)
                </Label>
                <Input
                  id="passingScore"
                  type="number"
                  value={quizPassingScore}
                  onChange={(e) => setQuizPassingScore(e.target.value)}
                  className="w-full"
                  min="0"
                  max="100"
                />
              </div>

              {/* Attempts */}
              <div>
                <Label htmlFor="attempts" className="text-sm font-medium mb-2 block">
                  Attempts
                </Label>
                <Input
                  id="attempts"
                  type="number"
                  value={quizAttempts}
                  onChange={(e) => setQuizAttempts(e.target.value)}
                  className="w-full"
                  min="1"
                />
              </div>

              {/* Time Limit */}
              <div>
                <Label htmlFor="timeLimit" className="text-sm font-medium mb-2 block">
                  Time (min)
                </Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={quizTimeLimit}
                  onChange={(e) => setQuizTimeLimit(e.target.value)}
                  className="w-full"
                  min="1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAddQuizOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddQuiz}
              className="bg-[#00B140] hover:bg-[#009636] text-white px-6"
              disabled={!quizTitle.trim()}
            >
              Add Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
