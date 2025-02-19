import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PenSquare, Calendar, Plus } from 'lucide-react';

const CreateSprintForm = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl bg-white rounded-3xl">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-semibold">Create Sprint</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            {/* Sprint Name Input */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Input 
                  placeholder="Sprint Name"
                  className="border-gray-200"
                />
              </div>
            </div>

            {/* Description Input */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Textarea 
                  placeholder="Description"
                  className="min-h-[100px] border-gray-200"
                />
              </div>
            </div>

            {/* Duration (Start & End Date) */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    type="text"
                    placeholder="Start Date"
                    className="border-gray-200"
                  />
                  <Input 
                    type="text"
                    placeholder="End Date"
                    className="border-gray-200"
                  />
                </div>
              </div>
            </div>

            {/* Priority Level */}
            <div className="flex items-start gap-3">
              <PenSquare className="w-5 h-5 mt-2 text-gray-500" />
              <div className="flex-1">
                <Label className="mb-2 block">Priority Level</Label>
                {/* Add your priority level implementation here if needed */}
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
                  <div className="flex items-center bg-blue-100 rounded-full pr-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>WL</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-sm text-blue-700">Williams Lady</span>
                  </div>
                  <div className="flex items-center bg-blue-100 rounded-full pr-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>AK</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-sm text-blue-700">Abdou Koli</span>
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
            <Button 
              variant="outline" 
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              className="px-6 bg-navy-blue"
            >
              + Add a Sprint
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSprintForm;