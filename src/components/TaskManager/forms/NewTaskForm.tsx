/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PenSquare,
  Calendar,
  Paperclip,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { StandardTaskFormData } from "@/lib/types/taskManager/types";

interface NewTaskFormProps {
  onSubmit: (data: StandardTaskFormData) => void;
  isSubmitting: boolean;
}
const NewTaskForm: React.FC<NewTaskFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    date: new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    tags: "",
    assignees: [],
    category: "development",
    progress: 0,
  });

  const [selectedCategory, setSelectedCategory] =
    useState<string>("development");
  const [priority, setPriority] = useState<string>("medium");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Map priority to tags
    let tags = formData.tags;
    if (!tags.includes(priority)) {
      tags = tags ? `${tags},${priority}` : priority;
    }

    onSubmit({
      ...formData,
      tags,
      category: selectedCategory as any,
    });
  };
  return (
    <form onSubmit={handleSubmitForm}>
      <Card className="w-full bg-white border-none">
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            {/* Title Input */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Input
                  name="title"
                  placeholder="Task Name"
                  className="border-gray-200"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Description Input */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Textarea
                  name="description"
                  placeholder="Description"
                  className="min-h-[100px] border-gray-200"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Due Date Input */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Input
                  name="date"
                  type="text"
                  placeholder="Due Date"
                  className="border-gray-200"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Priority Level */}
            <div className="flex items-start gap-3 p-0">
              <AlertTriangle className="w-6 h-6 text-gray-500" />
              <div className="flex-1 item-center">
                <RadioGroup
                  value={priority}
                  onValueChange={setPriority}
                  className="flex gap-6"
                >
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
                    <span className="ml-2 text-sm ">Williams Lady</span>
                  </div>
                  <div className="flex items-center rounded-full pr-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>AK</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-sm">Abdou Koli</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="flex items-start gap-3">
              <Plus className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Label className="mb-2 block">Category</Label>
                <select
                  className="w-full border rounded p-2"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="development">Development</option>
                  <option value="marketing">Marketing</option>
                  <option value="sales">Sales</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-start gap-3">
              <Plus className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Label className="mb-2 block">Tags (comma separated)</Label>
                <Input
                  name="tags"
                  placeholder="Enter tags separated by commas"
                  className="border-gray-200"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Attachment */}
            <div className="flex items-start gap-3">
              <Paperclip className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                >
                  Add Attachment
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  (Attachments can be added after creating the task)
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" className="px-6">
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 bg-teal-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "+ Add a task"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default NewTaskForm;
