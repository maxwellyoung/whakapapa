/**
 * User-friendly error messages for non-technical family members
 *
 * These messages explain what went wrong and what to do about it
 * in plain language that anyone can understand.
 */

export type ErrorContext =
  | 'create_person'
  | 'update_person'
  | 'delete_person'
  | 'create_relationship'
  | 'create_source'
  | 'upload_file'
  | 'process_text'
  | 'approve_suggestion'
  | 'reject_suggestion'
  | 'create_workspace'
  | 'update_workspace'
  | 'delete_workspace'
  | 'invite_member'
  | 'remove_member'
  | 'create_group'
  | 'delete_group'
  | 'add_citation'
  | 'remove_citation'
  | 'update_visibility'
  | 'export_data'
  | 'auth'

interface FriendlyError {
  title: string
  description: string
  suggestion?: string
}

const ERROR_MESSAGES: Record<ErrorContext, FriendlyError> = {
  create_person: {
    title: "Couldn't add this person",
    description: "We weren't able to save this person to your family tree.",
    suggestion: "Please check your internet connection and try again. If the problem continues, the name might already exist."
  },
  update_person: {
    title: "Changes weren't saved",
    description: "We couldn't save your changes to this person's details.",
    suggestion: "Please try again. If this keeps happening, try refreshing the page."
  },
  delete_person: {
    title: "Couldn't remove this person",
    description: "We weren't able to remove this person from your family tree.",
    suggestion: "Make sure you have permission to make changes, then try again."
  },
  create_relationship: {
    title: "Couldn't add this relationship",
    description: "We weren't able to connect these family members.",
    suggestion: "Check that both people exist in your tree and try again."
  },
  create_source: {
    title: "Couldn't save this source",
    description: "We weren't able to add this document or note.",
    suggestion: "Please try again. Make sure you've filled in the required fields."
  },
  upload_file: {
    title: "Upload didn't complete",
    description: "We couldn't upload your file.",
    suggestion: "Check that the file isn't too large (max 50MB) and try again. Photos, PDFs, and common file types work best."
  },
  process_text: {
    title: "Couldn't read your text",
    description: "We had trouble extracting information from what you pasted.",
    suggestion: "Try breaking the text into smaller pieces, or add the information manually instead."
  },
  approve_suggestion: {
    title: "Couldn't approve this suggestion",
    description: "We weren't able to add this information to your tree.",
    suggestion: "Please try again. If the problem continues, you can add the information manually."
  },
  reject_suggestion: {
    title: "Couldn't dismiss this suggestion",
    description: "We weren't able to remove this suggestion.",
    suggestion: "Please refresh the page and try again."
  },
  create_workspace: {
    title: "Couldn't create your family tree",
    description: "We weren't able to set up your new workspace.",
    suggestion: "Please try again with a different name."
  },
  update_workspace: {
    title: "Settings weren't saved",
    description: "We couldn't update your workspace settings.",
    suggestion: "Please try again. Make sure you have permission to change settings."
  },
  delete_workspace: {
    title: "Couldn't delete this workspace",
    description: "We weren't able to remove this family tree.",
    suggestion: "Only the workspace owner can delete it. Make sure all data is backed up first."
  },
  invite_member: {
    title: "Invitation wasn't sent",
    description: "We couldn't send an invitation to this person.",
    suggestion: "Check the email address is correct and try again."
  },
  remove_member: {
    title: "Couldn't remove this member",
    description: "We weren't able to remove this person from the workspace.",
    suggestion: "Make sure you have admin permissions, then try again."
  },
  create_group: {
    title: "Couldn't create this group",
    description: "We weren't able to set up this privacy group.",
    suggestion: "Try a different group name and try again."
  },
  delete_group: {
    title: "Couldn't delete this group",
    description: "We weren't able to remove this privacy group.",
    suggestion: "Make sure no items are still using this group for visibility."
  },
  add_citation: {
    title: "Couldn't link this source",
    description: "We weren't able to connect this source to the person.",
    suggestion: "Please try again."
  },
  remove_citation: {
    title: "Couldn't unlink this source",
    description: "We weren't able to disconnect this source.",
    suggestion: "Please try again."
  },
  update_visibility: {
    title: "Privacy settings weren't saved",
    description: "We couldn't update who can see this information.",
    suggestion: "Please try again. You may need editor permissions to change visibility."
  },
  export_data: {
    title: "Export didn't complete",
    description: "We couldn't download your family tree data.",
    suggestion: "Try exporting a smaller date range or fewer people. Large exports may take longer."
  },
  auth: {
    title: "Sign in problem",
    description: "We couldn't complete the sign in process.",
    suggestion: "Please try again. Check that you're using the correct email address."
  }
}

/**
 * Get a user-friendly error message for display
 */
export function getFriendlyError(context: ErrorContext): FriendlyError {
  return ERROR_MESSAGES[context]
}

/**
 * Format an error for toast display with helpful context
 */
export function getErrorToast(context: ErrorContext): string {
  const error = ERROR_MESSAGES[context]
  return `${error.title}. ${error.suggestion || error.description}`
}

/**
 * Format a detailed error for display in an alert or modal
 */
export function getDetailedError(context: ErrorContext, technicalError?: string): {
  title: string
  description: string
  suggestion: string
  technical?: string
} {
  const error = ERROR_MESSAGES[context]
  return {
    title: error.title,
    description: error.description,
    suggestion: error.suggestion || "Please try again or contact support if this continues.",
    technical: technicalError
  }
}
