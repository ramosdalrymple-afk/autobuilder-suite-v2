import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  InputField,
  Label,
  Flex
} from "@webstudio-is/design-system";

export type SaveAsTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description: string; category: string }) => Promise<void> | void;
  defaultName?: string;
  defaultDescription?: string;
  defaultCategory?: string;
};

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  onSave,
  defaultName = "",
  defaultDescription = "",
  defaultCategory = "other",
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [category, setCategory] = useState(defaultCategory);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onSave({ name, description, category });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Save as Template</DialogTitle>
        <Flex direction="column" gap="3">
          <Label>Template Name</Label>
          <InputField value={name} onChange={e => setName(e.target.value)} />
          <Label>Description</Label>
          <InputField value={description} onChange={e => setDescription(e.target.value)} />
          <Label>Category</Label>
          <InputField value={category} onChange={e => setCategory(e.target.value)} />
        </Flex>
        <DialogActions>
          <Button onClick={handleSave} state={loading ? "pending" : undefined}>
            Save
          </Button>
          <Button color="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
