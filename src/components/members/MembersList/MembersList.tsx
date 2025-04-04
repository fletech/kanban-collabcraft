import { useMember } from "@/contexts/MemberContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, UserX } from "lucide-react";
import { useEffect } from "react";

export function MembersList() {
  const { members, isLoading, updateMemberRole, removeMember } = useMember();

  useEffect(() => {
    console.log("MembersList rendering with", members.length, "members");
    console.log("isLoading:", isLoading);
  }, [members, isLoading]);

  if (isLoading) {
    return <div>Loading Members...</div>;
  }

  if (members.length === 0) {
    return <div>No members found for this project.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={member.user?.avatar_url || undefined} />
                <AvatarFallback>
                  {member.user?.full_name?.charAt(0) ||
                    member.user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {member.user?.full_name || "Sin nombre"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.user?.email}
                </p>
              </div>
              <span className="ml-4 text-sm bg-secondary px-2 py-1 rounded">
                {member.role}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => updateMemberRole(member.id, "admin")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Make Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => removeMember(member.id)}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Remove Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
