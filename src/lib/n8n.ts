import axios from "axios"
import { supabase } from "./supabase"

const DEFAULT_WEBHOOK_BASE = (import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined) ?? ""

if (!DEFAULT_WEBHOOK_BASE) {
    console.warn("Missing VITE_N8N_WEBHOOK_URL — falling back to per-client n8n_webhook_base if present.")
}

interface TriggerOptions {
    /** Service id to associate with the resulting execution row. */
    serviceId?: string | null
    /** Client id (required for execution logging). */
    clientId: string
    /** Per-client n8n base URL; falls back to VITE_N8N_WEBHOOK_URL when absent. */
    webhookBase?: string | null
    /** User id that initiated the trigger. */
    triggeredBy?: string | null
}

interface TriggerResult<R = unknown> {
    executionId: string | null
    response: R | null
    error?: string
}

/**
 * Triggers an n8n workflow and logs the run into the `executions` table.
 *
 * Flow:
 *   1. Insert a `pending` execution row.
 *   2. POST { ...payload, execution_id, client_id } to ${base}/${workflowName}.
 *   3. Update the execution row with status/result/error/finished_at.
 *
 * Returns the execution id alongside the workflow response so callers can
 * link to Logs or correlate downstream rows.
 */
export async function triggerWorkflow<R = unknown>(
    workflowName: string,
    payload: Record<string, unknown>,
    opts: TriggerOptions
): Promise<TriggerResult<R>> {
    const base = opts.webhookBase || DEFAULT_WEBHOOK_BASE
    if (!base) {
        return { executionId: null, response: null, error: "No n8n webhook base configured." }
    }

    const { data: inserted, error: insertError } = await supabase
        .from("executions")
        .insert({
            client_id: opts.clientId,
            service_id: opts.serviceId ?? null,
            workflow_name: workflowName,
            status: "pending",
            payload,
            triggered_by: opts.triggeredBy ?? null,
        })
        .select("id")
        .single()

    if (insertError) {
        console.error("Failed to insert execution row", insertError)
    }

    const executionId = inserted?.id ?? null

    try {
        const url = `${base.replace(/\/$/, "")}/${workflowName}`
        const response = await axios.post<R>(url, {
            ...payload,
            execution_id: executionId,
            client_id: opts.clientId,
        })

        if (executionId) {
            await supabase
                .from("executions")
                .update({
                    status: "success",
                    result: serialiseResult(response.data),
                    finished_at: new Date().toISOString(),
                })
                .eq("id", executionId)
        }

        return { executionId, response: response.data }
    } catch (err) {
        const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : err instanceof Error
                ? err.message
                : "Unknown error"

        if (executionId) {
            await supabase
                .from("executions")
                .update({
                    status: "error",
                    error_message: message,
                    finished_at: new Date().toISOString(),
                })
                .eq("id", executionId)
        }

        return { executionId, response: null, error: message }
    }
}

function serialiseResult(data: unknown): Record<string, unknown> | null {
    if (data === null || data === undefined) return null
    if (typeof data === "object") return data as Record<string, unknown>
    return { value: data }
}

// Backwards-compatible namespace export.
export const n8n = { triggerWorkflow }
