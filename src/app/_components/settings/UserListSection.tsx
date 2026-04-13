"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  User,
  Shield,
  FileAudio,
  ListMusic,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Ban,
} from "lucide-react";
import { api } from "~/trpc/react";
import UserModal from "./UserModal";
import { useDisclosure } from "@heroui/use-disclosure";
import { useTranslations } from "next-intl";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  isAdmin: boolean;
  isDisabled: boolean;
  image: string | null;
  _count: {
    audios: number;
    playlists: number;
    sessions: number;
  };
}

export default function UserListSection() {
  const t = useTranslations("UserList");
  const {
    data: users,
    isLoading,
    error,
  } = api.admin.userManagement.getAllUsers.useQuery();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const utils = api.useUtils();

  const deleteUserMutation = api.admin.userManagement.deleteUser.useMutation({
    onSuccess: () => {
      void utils.admin.userManagement.getAllUsers.invalidate();
      setSuccessMessage(t("messages.userDeleted"));
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      alert(t("messages.deleteError", { message: error.message }));
    },
  });

  const handleAddUser = () => {
    setSelectedUser(null);
    onOpen();
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm(t("confirm.deleteUser"))) {
      deleteUserMutation.mutate({ id: userId });
    }
  };

  const handleModalSuccess = () => {
    setSuccessMessage(
      selectedUser ? t("messages.userUpdated") : t("messages.userCreated"),
    );
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="flex min-h-[400px] items-center justify-center">
            <Spinner size="lg" label={t("loading")} />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-danger">
              {t("errors.loadingUsers", { message: error.message })}
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between gap-3">
          <div className="flex gap-3">
            <User className="h-5 w-5" />
            <div className="flex flex-col">
              <p className="text-lg font-semibold">{t("title")}</p>
              <p className="text-small text-default-500">
                {t("total", { count: users?.length ?? 0 })}
              </p>
            </div>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={handleAddUser}
          >
            {t("actions.addUser")}
          </Button>
        </CardHeader>
        <CardBody>
          {successMessage && (
            <div className="mb-4 rounded-lg bg-success-50 p-3 text-sm text-success">
              {successMessage}
            </div>
          )}
          <Table aria-label={t("table.ariaLabel")} className="min-h-[400px]">
            <TableHeader>
              <TableColumn>{t("table.columns.user")}</TableColumn>
              <TableColumn>{t("table.columns.email")}</TableColumn>
              <TableColumn>{t("table.columns.role")}</TableColumn>
              <TableColumn>{t("table.columns.status")}</TableColumn>
              <TableColumn>{t("table.columns.audios")}</TableColumn>
              <TableColumn>{t("table.columns.playlists")}</TableColumn>
              <TableColumn>{t("table.columns.actions")}</TableColumn>
            </TableHeader>
            <TableBody items={users ?? []} emptyContent={t("table.empty")}>
              {(user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.image ?? undefined}
                        name={user.name ?? user.email ?? t("labels.user")}
                        size="sm"
                        fallback={<User className="h-4 w-4" />}
                      />
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold">
                          {user.name ?? t("labels.noName")}
                        </p>
                        <p className="text-xs text-default-400">{user.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {user.email ?? t("labels.noEmail")}
                    </p>
                  </TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Chip
                        startContent={<Shield className="h-3 w-3" />}
                        color="warning"
                        size="sm"
                        variant="flat"
                      >
                        {t("roles.admin")}
                      </Chip>
                    ) : (
                      <Chip color="default" size="sm" variant="flat">
                        {t("roles.user")}
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {user.isDisabled ? (
                        <Chip
                          startContent={<Ban className="h-3 w-3" />}
                          color="danger"
                          size="sm"
                          variant="flat"
                        >
                          {t("status.disabled")}
                        </Chip>
                      ) : user.emailVerified ? (
                        <Chip color="success" size="sm" variant="flat">
                          {t("status.active")}
                        </Chip>
                      ) : (
                        <Chip color="warning" size="sm" variant="flat">
                          {t("status.unverified")}
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileAudio className="h-4 w-4 text-default-400" />
                      <span className="text-sm">{user._count.audios}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ListMusic className="h-4 w-4 text-default-400" />
                      <span className="text-sm">{user._count.playlists}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label={t("actions.ariaLabel")}>
                        <DropdownItem
                          key="edit"
                          startContent={<Pencil className="h-4 w-4" />}
                          onPress={() => handleEditUser(user)}
                        >
                          {t("actions.edit")}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={<Trash2 className="h-4 w-4" />}
                          onPress={() => handleDeleteUser(user.id)}
                        >
                          {t("actions.delete")}
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <UserModal
        isOpen={isOpen}
        onClose={onClose}
        user={selectedUser}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
