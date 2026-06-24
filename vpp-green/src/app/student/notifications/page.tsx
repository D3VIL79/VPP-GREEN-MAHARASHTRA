"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Trash2, ShieldAlert, CheckCircle2, Megaphone, Trophy, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/lib/use-api";
import { notificationApi } from "@/lib/api";

export default function StudentNotifications() {
  const { data: notifications, isLoading, execute: fetchNotifications } = useApi(notificationApi.getMine);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead();
    fetchNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await notificationApi.markAsRead(id);
    fetchNotifications();
  };

  const handleClearAll = async () => {
    await notificationApi.clearAll();
    fetchNotifications();
  };

  if (isLoading && !notifications) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated on tree approvals, campus announcements, and environmental awards.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-card/50 text-xs" onClick={handleMarkAllRead}>
            <Check className="h-4 w-4 mr-1.5" /> Mark All Read
          </Button>
          <Button variant="outline" size="sm" className="bg-card/50 text-xs text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications?.length === 0 ? (
          <div className="text-center p-12 bg-background/50 rounded-xl border border-dashed text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">You're all caught up!</h3>
            <p className="text-sm mt-1">No new notifications at the moment.</p>
          </div>
        ) : (
          notifications?.map((notif, i) => {
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                className={notif.isRead ? "" : "cursor-pointer"}
              >
                <Card className={`border-border/50 backdrop-blur-xl shadow-sm transition-colors ${
                  notif.isRead ? "bg-card/40 opacity-80" : "bg-card/80 border-primary/20 hover:border-primary/50"
                }`}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${
                      notif.type === "SYSTEM" ? "bg-success/10 border-success/20 text-success" :
                      notif.type === "ALERT" ? "bg-destructive/10 border-destructive/20 text-destructive animate-pulse" :
                      notif.type === "CAMPAIGN" ? "bg-primary/10 border-primary/20 text-primary" :
                      "bg-accent/10 border-accent/20 text-amber-600"
                    }`}>
                      {notif.type === "SYSTEM" && <CheckCircle2 className="h-5 w-5" />}
                      {notif.type === "ALERT" && <ShieldAlert className="h-5 w-5" />}
                      {notif.type === "CAMPAIGN" && <Megaphone className="h-5 w-5" />}
                      {notif.type !== "SYSTEM" && notif.type !== "ALERT" && notif.type !== "CAMPAIGN" && <Bell className="h-5 w-5" />}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground">{notif.title}</h3>
                          {!notif.isRead && <Badge className="bg-primary hover:bg-primary text-[10px] py-0 px-1.5">New</Badge>}
                        </div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-normal">{notif.message}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
