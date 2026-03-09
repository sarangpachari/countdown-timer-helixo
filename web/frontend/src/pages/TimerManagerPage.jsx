import { useState, useEffect, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Text,
  Badge,
  Button,
  TextField,
  EmptyState,
  Toast,
  Frame,
  ActionList,
  Popover,
  BlockStack,
  InlineStack,
  Thumbnail,
  Banner,
} from "@shopify/polaris";
import { useTimers } from "../hooks/useTimers.js";
import TimerModal from "../components/TimerModal.jsx";

function getStatusBadge(timer) {
  const now = new Date();
  const start = new Date(timer.startDate);
  const end = new Date(timer.endDate);

  if (now < start) return <Badge tone="info">Scheduled</Badge>;
  if (now > end) return <Badge tone="critical">Expired</Badge>;
  return <Badge tone="success">Active</Badge>;
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TimerActionsPopover({ timer, onEdit, onDelete }) {
  const [active, setActive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleActive = useCallback(() => setActive((prev) => !prev), []);

  const activator = (
    <Button
      variant="plain"
      onClick={toggleActive}
      accessibilityLabel="Timer actions"
    >
      ···
    </Button>
  );

  if (confirmDelete) {
    return (
      <InlineStack gap="200" blockAlign="center">
        <Text tone="critical" variant="bodySm">
          Delete?
        </Text>
        <Button
          variant="plain"
          tone="critical"
          onClick={() => {
            setConfirmDelete(false);
            onDelete(timer._id);
          }}
        >
          Yes
        </Button>
        <Button variant="plain" onClick={() => setConfirmDelete(false)}>
          No
        </Button>
      </InlineStack>
    );
  }

  return (
    <Popover
      active={active}
      activator={activator}
      autofocusTarget="first-node"
      onClose={toggleActive}
    >
      <ActionList
        actionRole="menuitem"
        items={[
          {
            content: "Edit timer",
            onAction: () => {
              setActive(false);
              onEdit(timer);
            },
          },
          {
            content: "Delete timer",
            destructive: true,
            onAction: () => {
              setActive(false);
              setConfirmDelete(true);
            },
          },
        ]}
      />
    </Popover>
  );
}

export default function TimerManagerPage() {
  const { timers, loading, error, fetchTimers, createTimer, updateTimer, deleteTimer } =
    useTimers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTimer, setEditTimer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchTimers();
  }, [fetchTimers]);

  const openCreate = useCallback(() => {
    setEditTimer(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((timer) => {
    setEditTimer(timer);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(
    async (data) => {
      if (editTimer) {
        await updateTimer(editTimer._id, data);
        setToast({ content: "Timer updated successfully!", tone: "success" });
      } else {
        await createTimer(data);
        setToast({ content: "Timer created successfully!", tone: "success" });
      }
    },
    [editTimer, createTimer, updateTimer]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteTimer(id);
        setToast({ content: "Timer deleted.", tone: "success" });
      } catch {
        setToast({ content: "Failed to delete timer.", tone: "critical" });
      }
    },
    [deleteTimer]
  );

  const filteredTimers = timers.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rowMarkup = filteredTimers.map((timer, index) => (
    <IndexTable.Row id={timer._id} key={timer._id} position={index}>
      <IndexTable.Cell>
        <InlineStack gap="300" blockAlign="center">
          {/* Color swatch */}
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              borderRadius: 4,
              background: timer.color || "#4A90E2",
              border: "1px solid #c9cccf",
              flexShrink: 0,
            }}
          />
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {timer.name}
          </Text>
        </InlineStack>
        {timer.description && (
          <Text variant="bodySm" tone="subdued" as="p">
            {timer.description}
          </Text>
        )}
      </IndexTable.Cell>
      <IndexTable.Cell>{getStatusBadge(timer)}</IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodySm" as="span">
          {formatDateTime(timer.startDate)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodySm" as="span">
          {formatDateTime(timer.endDate)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge>{timer.size?.charAt(0).toUpperCase() + timer.size?.slice(1)}</Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <TimerActionsPopover
          timer={timer}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  const emptyState = (
    <EmptyState
      heading="Create your first countdown timer"
      action={{ content: "+ Create timer", onAction: openCreate }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Add urgency to your promotions by displaying live countdown timers on your product pages.</p>
    </EmptyState>
  );

  return (
    <Frame>
      <Page
        title="Countdown Timer Manager"
        subtitle="Create and manage countdown timers for your promotions."
        primaryAction={{
          content: "+ Create timer",
          onAction: openCreate,
        }}
      >
        <Layout>
          {error && (
            <Layout.Section>
              <Banner tone="critical" title="Error loading timers">
                <p>{error}</p>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <TextField
                  label="Search timers"
                  labelHidden
                  placeholder="Search timers…"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  clearButton
                  onClearButtonClick={() => setSearchQuery("")}
                  autoComplete="off"
                />

                <IndexTable
                  resourceName={{ singular: "timer", plural: "timers" }}
                  itemCount={filteredTimers.length}
                  headings={[
                    { title: "Timer name" },
                    { title: "Status" },
                    { title: "Start" },
                    { title: "End" },
                    { title: "Size" },
                    { title: "Actions" },
                  ]}
                  selectable={false}
                  loading={loading}
                  emptyState={emptyState}
                >
                  {rowMarkup}
                </IndexTable>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <TimerModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          editTimer={editTimer}
        />

        {toast && (
          <Toast
            content={toast.content}
            tone={toast.tone}
            onDismiss={() => setToast(null)}
          />
        )}
      </Page>
    </Frame>
  );
}
