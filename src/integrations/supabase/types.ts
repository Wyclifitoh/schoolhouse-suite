export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          name: string
          school_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          school_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          school_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_adjustments: {
        Row: {
          adjustment_type: string
          approval_status: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          id: string
          new_amount: number
          previous_amount: number
          reason: string
          requires_approval: boolean
          school_id: string
          student_fee_id: string
        }
        Insert: {
          adjustment_type: string
          approval_status?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          new_amount: number
          previous_amount: number
          reason: string
          requires_approval?: boolean
          school_id: string
          student_fee_id: string
        }
        Update: {
          adjustment_type?: string
          approval_status?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          new_amount?: number
          previous_amount?: number
          reason?: string
          requires_approval?: boolean
          school_id?: string
          student_fee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_adjustments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_adjustments_student_fee_id_fkey"
            columns: ["student_fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_carry_forwards: {
        Row: {
          amount: number
          applied_at: string | null
          created_at: string
          from_term_id: string | null
          id: string
          ledger_type: string
          school_id: string
          source_payment_id: string | null
          status: string
          student_id: string
          to_term_id: string | null
          type: string
        }
        Insert: {
          amount: number
          applied_at?: string | null
          created_at?: string
          from_term_id?: string | null
          id?: string
          ledger_type?: string
          school_id: string
          source_payment_id?: string | null
          status?: string
          student_id: string
          to_term_id?: string | null
          type?: string
        }
        Update: {
          amount?: number
          applied_at?: string | null
          created_at?: string
          from_term_id?: string | null
          id?: string
          ledger_type?: string
          school_id?: string
          source_payment_id?: string | null
          status?: string
          student_id?: string
          to_term_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_carry_forwards_from_term_id_fkey"
            columns: ["from_term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_carry_forwards_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_carry_forwards_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_carry_forwards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_carry_forwards_to_term_id_fkey"
            columns: ["to_term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_discounts: {
        Row: {
          applicable_to: string | null
          code: string | null
          condition_params: Json | null
          condition_type: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          priority: number
          school_id: string
          stackable: boolean
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          applicable_to?: string | null
          code?: string | null
          condition_params?: Json | null
          condition_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          school_id: string
          stackable?: boolean
          type?: string
          updated_at?: string
          value?: number
        }
        Update: {
          applicable_to?: string | null
          code?: string | null
          condition_params?: Json | null
          condition_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          school_id?: string
          stackable?: boolean
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fee_discounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_templates: {
        Row: {
          amount: number
          applicable_grades: string[] | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          fee_type: string
          fine_amount: number | null
          fine_frequency: string | null
          fine_type: string | null
          id: string
          is_active: boolean
          is_mandatory: boolean
          is_recurring: boolean
          ledger_type: string
          name: string
          priority: number | null
          school_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          applicable_grades?: string[] | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fee_type?: string
          fine_amount?: number | null
          fine_frequency?: string | null
          fine_type?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          is_recurring?: boolean
          ledger_type?: string
          name: string
          priority?: number | null
          school_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          applicable_grades?: string[] | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fee_type?: string
          fine_amount?: number | null
          fine_frequency?: string | null
          fine_type?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          is_recurring?: boolean
          ledger_type?: string
          name?: string
          priority?: number | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_audit_logs: {
        Row: {
          action: string
          amount_affected: number | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          performed_by: string
          school_id: string | null
          student_id: string | null
        }
        Insert: {
          action: string
          amount_affected?: number | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          performed_by: string
          school_id?: string | null
          student_id?: string | null
        }
        Update: {
          action?: string
          amount_affected?: number | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          performed_by?: string
          school_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_audit_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_automation_config: {
        Row: {
          allow_fee_adjustments: boolean
          allow_manual_allocation: boolean
          allow_manual_discounts: boolean
          auto_allocate_payments: boolean
          auto_apply_advance_credits: boolean
          auto_apply_eligible_discounts: boolean
          auto_assign_fees_on_enrollment: boolean
          auto_assign_fees_on_term_start: boolean
          auto_carry_forward_arrears: boolean
          default_allocation_strategy: string
          max_adjustment_without_approval: number | null
          max_discount_percent_without_approval: number | null
          reminder_days_before_due: number[] | null
          require_approval_for_adjustments: boolean
          require_approval_for_bulk_assignment: boolean
          require_approval_for_carry_forward: boolean
          require_approval_for_discounts: boolean
          school_id: string
          send_balance_reminder_sms: boolean
          send_payment_confirmation_sms: boolean
          updated_at: string
        }
        Insert: {
          allow_fee_adjustments?: boolean
          allow_manual_allocation?: boolean
          allow_manual_discounts?: boolean
          auto_allocate_payments?: boolean
          auto_apply_advance_credits?: boolean
          auto_apply_eligible_discounts?: boolean
          auto_assign_fees_on_enrollment?: boolean
          auto_assign_fees_on_term_start?: boolean
          auto_carry_forward_arrears?: boolean
          default_allocation_strategy?: string
          max_adjustment_without_approval?: number | null
          max_discount_percent_without_approval?: number | null
          reminder_days_before_due?: number[] | null
          require_approval_for_adjustments?: boolean
          require_approval_for_bulk_assignment?: boolean
          require_approval_for_carry_forward?: boolean
          require_approval_for_discounts?: boolean
          school_id: string
          send_balance_reminder_sms?: boolean
          send_payment_confirmation_sms?: boolean
          updated_at?: string
        }
        Update: {
          allow_fee_adjustments?: boolean
          allow_manual_allocation?: boolean
          allow_manual_discounts?: boolean
          auto_allocate_payments?: boolean
          auto_apply_advance_credits?: boolean
          auto_apply_eligible_discounts?: boolean
          auto_assign_fees_on_enrollment?: boolean
          auto_assign_fees_on_term_start?: boolean
          auto_carry_forward_arrears?: boolean
          default_allocation_strategy?: string
          max_adjustment_without_approval?: number | null
          max_discount_percent_without_approval?: number | null
          reminder_days_before_due?: number[] | null
          require_approval_for_adjustments?: boolean
          require_approval_for_bulk_assignment?: boolean
          require_approval_for_carry_forward?: boolean
          require_approval_for_discounts?: boolean
          school_id?: string
          send_balance_reminder_sms?: boolean
          send_payment_confirmation_sms?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_automation_config_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_transactions: {
        Row: {
          account_reference: string
          amount: number
          callback_received_at: string | null
          checkout_request_id: string | null
          confirmed_amount: number | null
          confirmed_phone: string | null
          created_at: string
          expires_at: string | null
          failure_reason: string | null
          fee_ids: string[] | null
          id: string
          initiated_at: string
          initiated_by: string | null
          ledger_type: string
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          payer_name: string | null
          phone_number: string
          raw_callback: Json | null
          result_code: number | null
          school_id: string
          status: string
          student_id: string | null
          term_id: string | null
          transaction_date: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          account_reference: string
          amount: number
          callback_received_at?: string | null
          checkout_request_id?: string | null
          confirmed_amount?: number | null
          confirmed_phone?: string | null
          created_at?: string
          expires_at?: string | null
          failure_reason?: string | null
          fee_ids?: string[] | null
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          ledger_type?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          payer_name?: string | null
          phone_number: string
          raw_callback?: Json | null
          result_code?: number | null
          school_id: string
          status?: string
          student_id?: string | null
          term_id?: string | null
          transaction_date?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Update: {
          account_reference?: string
          amount?: number
          callback_received_at?: string | null
          checkout_request_id?: string | null
          confirmed_amount?: number | null
          confirmed_phone?: string | null
          created_at?: string
          expires_at?: string | null
          failure_reason?: string | null
          fee_ids?: string[] | null
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          ledger_type?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          payer_name?: string | null
          phone_number?: string
          raw_callback?: Json | null
          result_code?: number | null
          school_id?: string
          status?: string
          student_id?: string | null
          term_id?: string | null
          transaction_date?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_transactions_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          allocated_at: string
          amount: number
          id: string
          payment_id: string
          student_fee_id: string
        }
        Insert: {
          allocated_at?: string
          amount: number
          id?: string
          payment_id: string
          student_fee_id: string
        }
        Update: {
          allocated_at?: string
          amount?: number
          id?: string
          payment_id?: string
          student_fee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_student_fee_id_fkey"
            columns: ["student_fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          ledger_type: string
          mpesa_transaction_id: string | null
          notes: string | null
          payer_phone: string | null
          payment_method: string
          receipt_url: string | null
          received_at: string
          recorded_by: string | null
          reference_number: string | null
          school_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          ledger_type?: string
          mpesa_transaction_id?: string | null
          notes?: string | null
          payer_phone?: string | null
          payment_method: string
          receipt_url?: string | null
          received_at?: string
          recorded_by?: string | null
          reference_number?: string | null
          school_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          ledger_type?: string
          mpesa_transaction_id?: string | null
          notes?: string | null
          payer_phone?: string | null
          payment_method?: string
          receipt_url?: string | null
          received_at?: string
          recorded_by?: string | null
          reference_number?: string | null
          school_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_sequences: {
        Row: {
          current_number: number
          fiscal_year: number
          prefix: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          current_number?: number
          fiscal_year?: number
          prefix?: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          current_number?: number
          fiscal_year?: number
          prefix?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_sequences_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          generated_at: string | null
          id: string
          payment_id: string
          pdf_url: string | null
          receipt_number: string
          school_id: string
        }
        Insert: {
          created_at?: string
          generated_at?: string | null
          id?: string
          payment_id: string
          pdf_url?: string | null
          receipt_number: string
          school_id: string
        }
        Update: {
          created_at?: string
          generated_at?: string | null
          id?: string
          payment_id?: string
          pdf_url?: string | null
          receipt_number?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          paybill_number: string | null
          phone: string | null
          sms_sender_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          paybill_number?: string | null
          phone?: string | null
          sms_sender_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          paybill_number?: string | null
          phone?: string | null
          sms_sender_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          cost: string | null
          created_at: string
          id: string
          message: string
          phone_number: string
          provider: string | null
          provider_message_id: string | null
          reference_id: string | null
          reference_type: string | null
          school_id: string | null
          status: string
          student_id: string | null
          triggered_by: string
        }
        Insert: {
          cost?: string | null
          created_at?: string
          id?: string
          message: string
          phone_number: string
          provider?: string | null
          provider_message_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          school_id?: string | null
          status?: string
          student_id?: string | null
          triggered_by: string
        }
        Update: {
          cost?: string | null
          created_at?: string
          id?: string
          message?: string
          phone_number?: string
          provider?: string | null
          provider_message_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          school_id?: string | null
          status?: string
          student_id?: string | null
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fee_discounts: {
        Row: {
          applied_at: string
          applied_by: string | null
          calculated_amount: number
          created_at: string
          discount_name: string
          discount_type: string
          fee_discount_id: string | null
          id: string
          original_value: number
          reason: string | null
          student_fee_id: string
        }
        Insert: {
          applied_at?: string
          applied_by?: string | null
          calculated_amount?: number
          created_at?: string
          discount_name: string
          discount_type: string
          fee_discount_id?: string | null
          id?: string
          original_value?: number
          reason?: string | null
          student_fee_id: string
        }
        Update: {
          applied_at?: string
          applied_by?: string | null
          calculated_amount?: number
          created_at?: string
          discount_name?: string
          discount_type?: string
          fee_discount_id?: string | null
          id?: string
          original_value?: number
          reason?: string | null
          student_fee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fee_discounts_fee_discount_id_fkey"
            columns: ["fee_discount_id"]
            isOneToOne: false
            referencedRelation: "fee_discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_discounts_student_fee_id_fkey"
            columns: ["student_fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fees: {
        Row: {
          academic_year_id: string | null
          adjusted_at: string | null
          adjusted_by: string | null
          amount_due: number
          amount_paid: number
          assigned_at: string
          assigned_by: string | null
          assignment_mode: string
          balance: number | null
          brought_forward_amount: number
          brought_forward_credit: number
          created_at: string
          discount_amount: number
          due_date: string | null
          fee_template_id: string
          fine_amount: number
          id: string
          last_payment_at: string | null
          ledger_type: string
          school_id: string
          status: string
          student_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          adjusted_at?: string | null
          adjusted_by?: string | null
          amount_due?: number
          amount_paid?: number
          assigned_at?: string
          assigned_by?: string | null
          assignment_mode?: string
          balance?: number | null
          brought_forward_amount?: number
          brought_forward_credit?: number
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          fee_template_id: string
          fine_amount?: number
          id?: string
          last_payment_at?: string | null
          ledger_type?: string
          school_id: string
          status?: string
          student_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          adjusted_at?: string | null
          adjusted_by?: string | null
          amount_due?: number
          amount_paid?: number
          assigned_at?: string
          assigned_by?: string | null
          assignment_mode?: string
          balance?: number | null
          brought_forward_amount?: number
          brought_forward_credit?: number
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          fee_template_id?: string
          fine_amount?: number
          id?: string
          last_payment_at?: string | null
          ledger_type?: string
          school_id?: string
          status?: string
          student_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_fee_template_id_fkey"
            columns: ["fee_template_id"]
            isOneToOne: false
            referencedRelation: "fee_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          admission_number: string
          created_at: string
          current_term_id: string | null
          date_of_birth: string | null
          first_name: string
          full_name: string | null
          gender: string | null
          grade: string | null
          id: string
          last_name: string
          parent_name: string | null
          parent_phone: string | null
          school_id: string
          status: string
          stream: string | null
          updated_at: string
        }
        Insert: {
          admission_number: string
          created_at?: string
          current_term_id?: string | null
          date_of_birth?: string | null
          first_name: string
          full_name?: string | null
          gender?: string | null
          grade?: string | null
          id?: string
          last_name: string
          parent_name?: string | null
          parent_phone?: string | null
          school_id: string
          status?: string
          stream?: string | null
          updated_at?: string
        }
        Update: {
          admission_number?: string
          created_at?: string
          current_term_id?: string | null
          date_of_birth?: string | null
          first_name?: string
          full_name?: string | null
          gender?: string | null
          grade?: string | null
          id?: string
          last_name?: string
          parent_name?: string | null
          parent_phone?: string | null
          school_id?: string
          status?: string
          stream?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_current_term_id_fkey"
            columns: ["current_term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          academic_year_id: string
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          name: string
          school_id: string
          start_date: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          school_id: string
          start_date: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          school_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      unmatched_payments: {
        Row: {
          account_reference: string | null
          amount: number
          created_at: string
          id: string
          matched_student_id: string | null
          mpesa_transaction_id: string | null
          payer_name: string | null
          phone_number: string
          received_at: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_notes: string | null
          resulting_payment_id: string | null
          status: string
          suggested_matches: Json | null
        }
        Insert: {
          account_reference?: string | null
          amount: number
          created_at?: string
          id?: string
          matched_student_id?: string | null
          mpesa_transaction_id?: string | null
          payer_name?: string | null
          phone_number: string
          received_at?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_notes?: string | null
          resulting_payment_id?: string | null
          status?: string
          suggested_matches?: Json | null
        }
        Update: {
          account_reference?: string | null
          amount?: number
          created_at?: string
          id?: string
          matched_student_id?: string | null
          mpesa_transaction_id?: string | null
          payer_name?: string | null
          phone_number?: string
          received_at?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_notes?: string | null
          resulting_payment_id?: string | null
          status?: string
          suggested_matches?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "unmatched_payments_matched_student_id_fkey"
            columns: ["matched_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unmatched_payments_mpesa_transaction_id_fkey"
            columns: ["mpesa_transaction_id"]
            isOneToOne: false
            referencedRelation: "mpesa_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unmatched_payments_resulting_payment_id_fkey"
            columns: ["resulting_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_manual_payment: {
        Args: {
          p_amount: number
          p_fee_ids: string[]
          p_notes?: string
          p_payment_date: string
          p_payment_method: string
          p_receipt_number: string
          p_recorded_by: string
          p_reference_number: string
          p_school_id: string
          p_student_id: string
        }
        Returns: {
          amount: number
          created_at: string
          id: string
          ledger_type: string
          mpesa_transaction_id: string | null
          notes: string | null
          payer_phone: string | null
          payment_method: string
          receipt_url: string | null
          received_at: string
          recorded_by: string | null
          reference_number: string | null
          school_id: string
          status: string
          student_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fuzzy_match_admission: {
        Args: { p_reference: string; p_school_id: string }
        Returns: {
          admission_number: string
          full_name: string
          id: string
          similarity_score: number
        }[]
      }
      generate_receipt: {
        Args: { p_payment_id: string; p_school_id: string }
        Returns: {
          receipt_id: string
          receipt_number: string
        }[]
      }
      get_student_balance: {
        Args: { p_ledger_type?: string; p_student_id: string }
        Returns: number
      }
      increment_fee_payment: {
        Args: { fee_id: string; payment_amount: number }
        Returns: undefined
      }
      next_receipt_number: { Args: { p_school_id: string }; Returns: string }
      release_advisory_lock: { Args: { lock_key: number }; Returns: boolean }
      try_advisory_lock: { Args: { lock_key: number }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
