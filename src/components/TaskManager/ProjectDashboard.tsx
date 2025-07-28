"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Users, List, BarChart2, Info } from "lucide-react";
import ProjectSelect from "./ProjectSelect";
import TaskBoard from "./TaskBoard";
import ProjectMembersPanel from "./ProjectMembersPanel";
import NoProjectSelected from "./NoProjectSelected";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
import EpicsPanel from "./EpicsPanel";
import MilestonesPanel from "./MilestonePanel";
import ShareButton from "./buttons/ShareButton";

const ProjectDashboard: React.FC = () => {
  const { currentProject, projectId, loading, isProjectAdmin } = useProjectContext(); // Add isProjectAdmin check
  const [activeTab, setActiveTab] = useState("board");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { useEpicsQuery, useMilestonesQuery } = useAuthAwareTaskManagerApi();

  // Only fetch epics and milestones if we have a project selected
  const { data: epics = [] } = useEpicsQuery(projectId || "");
  const { data: milestones = [] } = useMilestonesQuery(projectId || "");

  // Show loading state
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Loading project...</p>
      </div>
    );
  }

  // No project selected yet
  if (!currentProject) {
    return <NoProjectSelected />;
  }

  return (
    <div className="w-full min-h-screen overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Tabs Section with Info Button and Share Button */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="overflow-x-auto flex-grow">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="board" className="text-xs sm:text-sm px-2 sm:px-3">
                <span className="sm:hidden">Board</span>
                <span className="hidden sm:inline">Task Board</span>
              </TabsTrigger>
              <TabsTrigger value="epics" className="text-xs sm:text-sm px-2 sm:px-3">
                Epics
              </TabsTrigger>
              <TabsTrigger value="milestones" className="text-xs sm:text-sm px-2 sm:px-3">
                <span className="sm:hidden">Miles</span>
                <span className="hidden sm:inline">Milestones</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="text-xs sm:text-sm px-2 sm:px-3">
                <span className="sm:hidden">Team</span>
                <span className="hidden sm:inline">Team Members</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Share Button - Only show for admins */}
            {isProjectAdmin && (
              <ShareButton
                type="project"
                projectId={projectId || ""}
                size="sm"
                variant="outline"
                className="bg-green-600 text-white hover:bg-green-700 border-green-600"
              />
            )}

            {/* Project Info Modal Trigger Button */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-blue-600 text-white flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Project Info</span>
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Project Information</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Header Section */}

                  {/* Project Info and Stats Section */}
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Project Details */}
                    <div className="flex-grow">
                      <h2 className="text-xl sm:text-2xl font-bold mb-2">{currentProject.name}</h2>
                      {currentProject.description && (
                        <p className="text-gray-600 mb-4 text-sm sm:text-base">{currentProject.description}</p>
                      )}
                      <div className="flex flex-col xs:flex-row gap-2 xs:gap-4">
                        <div className="text-xs sm:text-sm">
                          <span className="text-gray-500">Start Date:</span>{" "}
                          {new Date(currentProject.startDate).toLocaleDateString()}
                        </div>
                        {currentProject.endDate && (
                          <div className="text-xs sm:text-sm">
                            <span className="text-gray-500">End Date:</span>{" "}
                            {new Date(currentProject.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Card - Responsive Width */}
                    <Card className="w-full lg:w-80 xl:w-96">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Project Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                        <div className="bg-gray-50 p-3 rounded text-center">
                          <div className="text-xl sm:text-2xl font-semibold">{epics.length}</div>
                          <div className="text-xs text-gray-500">Epics</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-center">
                          <div className="text-xl sm:text-2xl font-semibold">
                            {milestones.length}
                          </div>
                          <div className="text-xs text-gray-500">Milestones</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-center">
                          <div className="text-xl sm:text-2xl font-semibold">0</div>
                          <div className="text-xs text-gray-500">Tasks</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-center">
                          <div className="text-xl sm:text-2xl font-semibold">
                            {currentProject.members.length}
                          </div>
                          <div className="text-xs text-gray-500">Members</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="board" className="mt-4 sm:mt-6">
          <TaskBoard />
        </TabsContent>

        <TabsContent value="epics" className="mt-4 sm:mt-6">
          <EpicsPanel />
        </TabsContent>

        <TabsContent value="milestones" className="mt-4 sm:mt-6">
          <MilestonesPanel />
        </TabsContent>

        <TabsContent value="members" className="mt-4 sm:mt-6">
          <ProjectMembersPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;