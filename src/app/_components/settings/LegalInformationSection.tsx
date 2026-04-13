"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Plus, Edit, Trash2, Save, X, GripVertical } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

type LegalInfo = {
  id: string;
  label: string;
  content: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  updatedById: string | null;
};

export default function LegalInformationSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LegalInfo | null>(null);
  const [localItems, setLocalItems] = useState<LegalInfo[]>([]);
  const [formData, setFormData] = useState({
    label: "",
    content: "",
    enabled: true,
  });

  const utils = api.useUtils();

  // Queries
  const { data: legalInfos, isLoading } =
    api.admin.legalInformation.getAllLegalInfo.useQuery();

  // Sync local state with server data
  useEffect(() => {
    if (legalInfos) {
      setLocalItems(legalInfos);
    }
  }, [legalInfos]);

  // Mutations
  const createMutation = api.admin.legalInformation.createLegalInfo.useMutation(
    {
      onSuccess: () => {
        void utils.admin.legalInformation.getAllLegalInfo.invalidate();
        closeModal();
      },
    },
  );

  const updateMutation = api.admin.legalInformation.updateLegalInfo.useMutation(
    {
      onSuccess: () => {
        void utils.admin.legalInformation.getAllLegalInfo.invalidate();
        closeModal();
      },
    },
  );

  const deleteMutation = api.admin.legalInformation.deleteLegalInfo.useMutation(
    {
      onSuccess: () => {
        void utils.admin.legalInformation.getAllLegalInfo.invalidate();
      },
    },
  );

  const updateSortOrderMutation =
    api.admin.legalInformation.updateSortOrder.useMutation({
      onError: (error) => {
        console.error("Reorder error:", error);
        // On error, refetch to restore correct state
        void utils.admin.legalInformation.getAllLegalInfo.invalidate();
      },
    });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ label: "", content: "", enabled: true });
    setIsModalOpen(true);
  };

  const openEditModal = (item: LegalInfo) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      content: item.content,
      enabled: item.enabled,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ label: "", content: "", enabled: true });
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this legal information?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(localItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (reorderedItem) {
      items.splice(result.destination.index, 0, reorderedItem);
    }

    // Update local state immediately for smooth UI
    setLocalItems(items);

    // Update sort order for all items
    const updates = items.map((item, index) => ({
      id: item.id,
      sortOrder: index,
    }));

    updateSortOrderMutation.mutate({ items: updates });
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="flex min-h-[400px] items-center justify-center">
            <Spinner size="lg" label="Loading..." />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Legal Information</h2>
          <p className="text-sm text-default-500">
            Manage legal pages content (Terms, Privacy Policy, etc.)
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={openCreateModal}
        >
          Add Legal Page
        </Button>
      </div>

      <div className="grid gap-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="legal-info-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {localItems?.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={snapshot.isDragging ? "opacity-50" : ""}
                      >
                        <Card>
                          <CardHeader className="flex justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-default-400 hover:text-default-600"
                              >
                                <GripVertical size={20} />
                              </div>
                              <Switch
                                isSelected={item.enabled}
                                onValueChange={(enabled) =>
                                  updateMutation.mutate({
                                    id: item.id,
                                    enabled,
                                  })
                                }
                                size="sm"
                              />
                              <div>
                                <h3 className="font-semibold">{item.label}</h3>
                                <p className="text-xs text-default-500">
                                  Last updated:{" "}
                                  {new Date(
                                    item.updatedAt,
                                  ).toLocaleDateString()}
                                  {item.updatedBy && (
                                    <>
                                      {" "}
                                      by{" "}
                                      {(
                                        item.updatedBy as {
                                          name: string | null;
                                          email: string | null;
                                        }
                                      ).name ??
                                        (
                                          item.updatedBy as {
                                            name: string | null;
                                            email: string | null;
                                          }
                                        ).email ??
                                        "Unknown"}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="light"
                                isIconOnly
                                onPress={() => openEditModal(item)}
                              >
                                <Edit size={18} />
                              </Button>
                              <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                isIconOnly
                                onPress={() => handleDelete(item.id)}
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardBody>
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none line-clamp-3"
                              dangerouslySetInnerHTML={{ __html: item.content }}
                            />
                          </CardBody>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {localItems?.length === 0 && (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-default-500">
                No legal information pages yet. Create one to get started.
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {editingItem ? "Edit Legal Page" : "Create Legal Page"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Label"
                placeholder="e.g., Privacy Policy, Terms of Service"
                value={formData.label}
                onValueChange={(value) =>
                  setFormData({ ...formData, label: value })
                }
                isRequired
              />

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Content
                </label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>

              <Switch
                isSelected={formData.enabled}
                onValueChange={(enabled) =>
                  setFormData({ ...formData, enabled })
                }
              >
                Enable this page
              </Switch>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeModal}>
              <X size={18} />
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              <Save size={18} />
              {editingItem ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
