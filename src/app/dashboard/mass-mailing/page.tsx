/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreVertical, PenSquare } from "lucide-react";

// Campaign Card Component
const CampaignCard = ({ name, email, role, status }: any) => (
  <Card className="mb-4">
    <CardContent className="p-4 flex items-center justify-between">
      <div className="flex justify-between">
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-sm text-gray-500">{email}</span>
          <span className="text-sm text-gray-600">{role}</span>
        </div>
        <button className="p-1">
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <div className="flex items-center gap-2 border-t border-gray-200">
        <div
          className={`w-7 h-7 rounded-full ${
            status === "pending"
              ? "bg-yellow-400"
              : status === "active"
              ? "bg-green-500"
              : "bg-green-500"
          }`}
        />
      </div>
    </CardContent>
  </Card>
);

// Tag Card Component
const TagCard = ({ title, description, contacts }: any) => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{title}</h3>
        <button className="p-1">
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-2">{description}</p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {contacts} Contacts
          </span>
        </div>
        <div className="flex -space-x-2">
          {[1, 2].map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-gray-300" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Sender Card Component
const SenderCard = ({ name, email, phone, status }: any) => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{name}</h3>
              <div className="text-sm text-gray-500">
                <div>{email}</div>
                <div>{phone}</div>
              </div>
            </div>
            <button className="p-1">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <div className="mt-2">
            <span
              className={`text-xs px-2 py-1 rounded ${
                status === "verified"
                  ? "bg-blue-100 text-blue-600"
                  : status === "unverified"
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const DashboardTabs = () => {
  return (
    <div className="px-6 py-2">
      <h2 className="text-2xl font-medium pb-2">Mass Mailing</h2>
      <Tabs defaultValue="campaigns" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="campaigns">Status</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="senders">Senders</TabsTrigger>
            <TabsTrigger value="autor">Autor</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="Search..."
              className="w-64"
              // prefix={<Search className="h-4 w-4 text-gray-500" />}
            />
          </div>
        </div>

        <TabsContent value="campaigns">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Pending Campaigns</h2>
                <button className="text-gray-500">+</button>
              </div>
              <CampaignCard
                name="Olivia Anderson"
                email="olivia@example.com"
                role="UI Designer"
                status="pending"
              />
              <CampaignCard
                name="Olivia Anderson"
                email="olivia@example.com"
                role="UI Designer"
                status="pending"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Active Campaigns</h2>
                <button className="text-gray-500">+</button>
              </div>
              <CampaignCard
                name="Olivia Anderson"
                email="olivia@example.com"
                role="UI Designer"
                status="active"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Done Campaigns</h2>
                <button className="text-gray-500">+</button>
              </div>
              <CampaignCard
                name="Olivia Anderson"
                email="olivia@example.com"
                role="UI Designer"
                status="done"
              />
            </div>
          </div>
          <Button className="fixed bottom-8 md:right-[90px] shadow-lg" variant="default">
            <PenSquare className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </TabsContent>

        <TabsContent value="tags">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Frequently Used</h2>
                <button className="text-gray-500">+</button>
              </div>
              <TagCard
                title="VIP Customers"
                description="High-value customers with frequent activity"
                contacts={250}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Used</h2>
                <button className="text-gray-500">+</button>
              </div>
              <TagCard
                title="Newsletter Subscribers"
                description="Customers subscribed to weekly updates"
                contacts={250}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Recently Added</h2>
                <button className="text-gray-500">+</button>
              </div>
              <TagCard
                title="Holiday Campaign"
                description="New Year holiday campaign list"
                contacts={250}
              />
            </div>
          </div>
          <Button className="fixed bottom-8 md:right-[90px] shadow-lg" variant="default">
            <PenSquare className="h-4 w-4 mr-2" />
            Add New Tags
          </Button>
        </TabsContent>

        <TabsContent value="senders">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Verified Senders</h2>
                <button className="text-gray-500">+</button>
              </div>
              <SenderCard
                name="Olivia Anderson"
                email="olivia@example.com"
                phone="0912345678"
                status="verified"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Unverified Senders</h2>
                <button className="text-gray-500">+</button>
              </div>
              <SenderCard
                name="Olivia Anderson"
                email="olivia@example.com"
                phone="0912345678"
                status="unverified"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium">Default Senders</h2>
                <button className="text-gray-500">+</button>
              </div>
              <SenderCard
                name="Olivia Anderson"
                email="olivia@example.com"
                phone="0912345678"
                status="default"
              />
            </div>
          </div>
          <Button className="fixed bottom-8 md:right-[90px] shadow-lg" variant="default">
            <PenSquare className="h-4 w-4 mr-2" />
            Add New Sender
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardTabs;
