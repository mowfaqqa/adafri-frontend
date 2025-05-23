"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, List, BarChart2 } from "lucide-react";
import ProjectSelect from "./ProjectSelect";
import TaskBoard from "./TaskBoard";
import ProjectMembersPanel from "./ProjectMembersPanel";
import NoProjectSelected from "./NoProjectSelected";
import { useAuthAwareTaskManagerApi } from "@/lib/hooks/useAuthAwareTaskManagerApi";
import { useProjectContext } from "@/lib/context/task-manager/ProjectContext";
import EpicsPanel from "./EpicsPanel";
import MilestonesPanel from "./MilestonePanel";

const ProjectDashboard: React.FC = () => {
  const { currentProject, projectId, loading } = useProjectContext();
  const [activeTab, setActiveTab] = useState("board");

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
    <div className="w-full h-screen overflow-y-auto px-8 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <ProjectSelect />
          <div className="flex-grow"></div>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Timeline
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            {epics.length} Epics
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            {milestones.length} Milestones
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {currentProject.members.length} Members
          </Button>
        </div>

        <div className="flex items-start gap-6">
          <div className="flex-grow">
            <h1 className="text-2xl font-bold mb-2">{currentProject.name}</h1>
            {currentProject.description && (
              <p className="text-gray-600 mb-4">{currentProject.description}</p>
            )}
            <div className="flex gap-4">
              <div className="text-sm">
                <span className="text-gray-500">Start Date:</span>{" "}
                {new Date(currentProject.startDate).toLocaleDateString()}
              </div>
              {currentProject.endDate && (
                <div className="text-sm">
                  <span className="text-gray-500">End Date:</span>{" "}
                  {new Date(currentProject.endDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <Card className="w-80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Project Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-2xl font-semibold">{epics.length}</div>
                <div className="text-xs text-gray-500">Epics</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-2xl font-semibold">
                  {milestones.length}
                </div>
                <div className="text-xs text-gray-500">Milestones</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-2xl font-semibold">0</div>
                <div className="text-xs text-gray-500">Tasks</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-2xl font-semibold">
                  {currentProject.members.length}
                </div>
                <div className="text-xs text-gray-500">Members</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="board">Task Board</TabsTrigger>
          <TabsTrigger value="epics">Epics</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <TaskBoard />
        </TabsContent>

        <TabsContent value="epics" className="mt-6">
          <EpicsPanel />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <MilestonesPanel />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <ProjectMembersPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;
