"use client"
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PenSquare,
  Calendar,
  Plus,
  AlertTriangle,
  Tag,
  ListChecks,
  Paperclip,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const MarketingTaskForm = () => {
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [newTag, setNewTag] = useState("");

  const addSubtask = () => {
    if (newSubtask.trim() !== "") {
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtask("");
    }
  };

  const addTag = () => {
    if (newTag.trim() !== "") {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-xl bg-white rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-semibold">
            Create Campaign
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            {/* Campaign Name Input */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Input
                  placeholder="Campaign Name"
                  className="border-gray-200"
                />
              </div>
            </div>

            {/* Description Input */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Textarea
                  placeholder="Objective"
                  className="min-h-[100px] border-gray-200"
                />
              </div>
            </div>

            {/* Duration (Start & End Date) */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Select Due Date"
                  className="border-gray-200"
                />
              </div>
            </div>

            {/* Subtasks Input */}
            <div className="flex items-start gap-3">
              <ListChecks className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Add Subtask"
                  className="border-gray-200"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={addSubtask}
                type="button"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Subtasks List */}
            {subtasks.length > 0 && (
              <div className="ml-8 space-y-2">
                {subtasks.map((subtask, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span>• {subtask}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tags Input */}
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Add Tags"
                  className="border-gray-200"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={addTag}
                type="button"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Tags List */}
            {tags.length > 0 && (
              <div className="ml-8 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* Attachment Note - for Cloudinary integration */}
            <div className="flex items-start gap-3">
              <Paperclip className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">
                  Files can be attached after creating the campaign
                </p>
              </div>
            </div>

            {/* Priority Level */}
            <div className="flex items-start gap-3 p-0">
              <AlertTriangle className="w-6 h-6 text-gray-500" />
              <div className="flex-1 item-center">
                <RadioGroup defaultValue="medium" className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="text-red-600 font-medium">
                      High
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label
                      htmlFor="medium"
                      className="text-yellow-600 font-medium"
                    >
                      Medium
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="text-green-600 font-medium">
                      Low
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Assignees */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-2">
                <Plus className="w-full h-full text-gray-500" />
              </div>
              <div className="flex-1">
                <Label className="mb-2 block">Assignees</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-full pr-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>WL</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-sm">Williams Lady</span>
                  </div>
                  <div className="flex items-center rounded-full pr-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>AK</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-sm">Abdou Koli</span>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" className="px-6">
              Cancel
            </Button>
            <Button className="px-6 bg-teal-600">+ Add a Campaign</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingTaskForm;
