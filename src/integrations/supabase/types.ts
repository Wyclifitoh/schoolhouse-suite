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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          school_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          school_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          school_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          head_staff_id: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          head_staff_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          head_staff_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_staff_id_fkey"
            columns: ["head_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      designations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "designations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          budget: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          budget?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          budget?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category_id: string | null
          created_at: string
          description: string | null
          expense_date: string
          id: string
          payment_method: string
          recorded_by: string | null
          reference: string | null
          school_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          payment_method?: string
          recorded_by?: string | null
          reference?: string | null
          school_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          payment_method?: string
          recorded_by?: string | null
          reference?: string | null
          school_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_school_id_fkey"
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
      fee_categories: {
        Row: {
          created_at: string | null
          description: string | null
          gl_code: string | null
          id: string
          is_optional: boolean | null
          is_refundable: boolean | null
          name: string
          school_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          gl_code?: string | null
          id?: string
          is_optional?: boolean | null
          is_refundable?: boolean | null
          name: string
          school_id: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          gl_code?: string | null
          id?: string
          is_optional?: boolean | null
          is_refundable?: boolean | null
          name?: string
          school_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
      fee_structures: {
        Row: {
          academic_year_id: string
          amount: number
          applies_to_continuing: boolean | null
          applies_to_new_students: boolean | null
          created_at: string | null
          due_date: string | null
          fee_category_id: string
          grade_id: string | null
          id: string
          is_mandatory: boolean | null
          name: string
          school_id: string
          term_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          amount?: number
          applies_to_continuing?: boolean | null
          applies_to_new_students?: boolean | null
          created_at?: string | null
          due_date?: string | null
          fee_category_id: string
          grade_id?: string | null
          id?: string
          is_mandatory?: boolean | null
          name: string
          school_id: string
          term_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          amount?: number
          applies_to_continuing?: boolean | null
          applies_to_new_students?: boolean | null
          created_at?: string | null
          due_date?: string | null
          fee_category_id?: string
          grade_id?: string | null
          id?: string
          is_mandatory?: boolean | null
          name?: string
          school_id?: string
          term_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
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
      grades: {
        Row: {
          created_at: string | null
          curriculum_type: string
          id: string
          level: Database["public"]["Enums"]["education_level"]
          name: string
          order_index: number
          school_id: string
        }
        Insert: {
          created_at?: string | null
          curriculum_type?: string
          id?: string
          level: Database["public"]["Enums"]["education_level"]
          name: string
          order_index?: number
          school_id: string
        }
        Update: {
          created_at?: string | null
          curriculum_type?: string
          id?: string
          level?: Database["public"]["Enums"]["education_level"]
          name?: string
          order_index?: number
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          assigned_by: string | null
          assigned_date: string
          attachment_url: string | null
          class_name: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          max_marks: number | null
          school_id: string
          section: string | null
          status: string
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_date?: string
          attachment_url?: string | null
          class_name: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          max_marks?: number | null
          school_id: string
          section?: string | null
          status?: string
          subject: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_date?: string
          attachment_url?: string | null
          class_name?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          max_marks?: number | null
          school_id?: string
          section?: string | null
          status?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          attachment_url: string | null
          content: string | null
          created_at: string
          evaluated_at: string | null
          evaluated_by: string | null
          homework_id: string
          id: string
          marks: number | null
          remarks: string | null
          school_id: string
          status: string
          student_id: string
          submission_date: string | null
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          homework_id: string
          id?: string
          marks?: number | null
          remarks?: string | null
          school_id: string
          status?: string
          student_id: string
          submission_date?: string | null
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          homework_id?: string
          id?: string
          marks?: number | null
          remarks?: string | null
          school_id?: string
          status?: string
          student_id?: string
          submission_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category_id: string | null
          cost_price: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          quantity_in_stock: number | null
          reorder_level: number | null
          school_id: string
          selling_price: number
          sku: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          quantity_in_stock?: number | null
          reorder_level?: number | null
          school_id: string
          selling_price?: number
          sku: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          quantity_in_stock?: number | null
          reorder_level?: number | null
          school_id?: string
          selling_price?: number
          sku?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          notes: string | null
          quantity: number
          recorded_by: string | null
          reference_id: string | null
          reference_type: string | null
          school_id: string
          total_amount: number | null
          type: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          recorded_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          school_id: string
          total_amount?: number | null
          type: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          recorded_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          school_id?: string
          total_amount?: number | null
          type?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_applications: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          rejection_reason: string | null
          school_id: string
          staff_id: string
          start_date: string
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          rejection_reason?: string | null
          school_id: string
          staff_id: string
          start_date: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          rejection_reason?: string | null
          school_id?: string
          staff_id?: string
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_applications_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_applications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_applications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          max_days: number | null
          name: string
          school_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_days?: number | null
          name: string
          school_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_days?: number | null
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
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
      notification_templates: {
        Row: {
          body: string
          channel: string
          created_at: string | null
          event_type: string
          id: string
          is_active: boolean | null
          name: string
          school_id: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          name: string
          school_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          school_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          recipient_contact: string
          recipient_id: string
          recipient_type: string
          school_id: string
          sent_at: string | null
          status: string | null
          subject: string | null
          template_id: string | null
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          recipient_contact: string
          recipient_id: string
          recipient_type: string
          school_id: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          recipient_contact?: string
          recipient_id?: string
          recipient_type?: string
          school_id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          alt_phone: string | null
          created_at: string | null
          email: string | null
          employer: string | null
          first_name: string
          id: string
          id_number: string | null
          last_name: string
          occupation: string | null
          phone: string
          school_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          created_at?: string | null
          email?: string | null
          employer?: string | null
          first_name: string
          id?: string
          id_number?: string | null
          last_name: string
          occupation?: string | null
          phone: string
          school_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          created_at?: string | null
          email?: string | null
          employer?: string | null
          first_name?: string
          id?: string
          id_number?: string | null
          last_name?: string
          occupation?: string | null
          phone?: string
          school_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          allocated_at: string
          allocated_by: string | null
          allocation_order: number | null
          amount: number
          id: string
          is_auto_allocated: boolean | null
          payment_id: string
          student_fee_id: string
        }
        Insert: {
          allocated_at?: string
          allocated_by?: string | null
          allocation_order?: number | null
          amount: number
          id?: string
          is_auto_allocated?: boolean | null
          payment_id: string
          student_fee_id: string
        }
        Update: {
          allocated_at?: string
          allocated_by?: string | null
          allocation_order?: number | null
          amount?: number
          id?: string
          is_auto_allocated?: boolean | null
          payment_id?: string
          student_fee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          bank_name: string | null
          bank_reference: string | null
          cheque_date: string | null
          cheque_number: string | null
          created_at: string
          id: string
          is_reconciled: boolean | null
          ledger_type: string
          mpesa_phone: string | null
          mpesa_receipt: string | null
          mpesa_transaction_id: string | null
          notes: string | null
          parent_id: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_method: string
          receipt_url: string | null
          received_at: string
          reconciled_at: string | null
          reconciled_by: string | null
          recorded_by: string | null
          reference_number: string | null
          school_id: string
          status: string
          student_id: string
          transaction_date: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_name?: string | null
          bank_reference?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          created_at?: string
          id?: string
          is_reconciled?: boolean | null
          ledger_type?: string
          mpesa_phone?: string | null
          mpesa_receipt?: string | null
          mpesa_transaction_id?: string | null
          notes?: string | null
          parent_id?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_method: string
          receipt_url?: string | null
          received_at?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          school_id: string
          status?: string
          student_id: string
          transaction_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          bank_reference?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          created_at?: string
          id?: string
          is_reconciled?: boolean | null
          ledger_type?: string
          mpesa_phone?: string | null
          mpesa_receipt?: string | null
          mpesa_transaction_id?: string | null
          notes?: string | null
          parent_id?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_method?: string
          receipt_url?: string | null
          received_at?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          school_id?: string
          status?: string
          student_id?: string
          transaction_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      payroll: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string
          created_by: string | null
          deductions: number | null
          id: string
          month: number
          net_salary: number
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          school_id: string
          staff_id: string
          tax: number | null
          updated_at: string
          year: number
        }
        Insert: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          id?: string
          month: number
          net_salary?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          school_id: string
          staff_id: string
          tax?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          id?: string
          month?: number
          net_salary?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          school_id?: string
          staff_id?: string
          tax?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: Database["public"]["Enums"]["permission_category"]
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: Database["public"]["Enums"]["permission_category"]
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["permission_category"]
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      pos_sale_items: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          item_id: string
          line_total: number
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id?: string
          item_id: string
          line_total?: number
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          item_id?: string
          line_total?: number
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sale_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          payment_id: string | null
          payment_method: string
          sale_date: string | null
          sale_number: string
          school_id: string
          sold_by: string
          student_id: string | null
          subtotal: number
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_method?: string
          sale_date?: string | null
          sale_number: string
          school_id: string
          sold_by: string
          student_id?: string | null
          subtotal?: number
          total_amount?: number
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_method?: string
          sale_date?: string | null
          sale_number?: string
          school_id?: string
          sold_by?: string
          student_id?: string | null
          subtotal?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_name: string
          mfa_enabled: boolean | null
          password_changed_at: string | null
          phone: string | null
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string
          mfa_enabled?: boolean | null
          password_changed_at?: string | null
          phone?: string | null
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string
          mfa_enabled?: boolean | null
          password_changed_at?: string | null
          phone?: string | null
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      school_role_permissions: {
        Row: {
          created_at: string | null
          id: string
          is_granted: boolean
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_granted: boolean
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_granted?: boolean
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_role_permissions_school_id_fkey"
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
          code: string | null
          county: string | null
          created_at: string
          curriculum_type: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          paybill_number: string | null
          phone: string | null
          settings: Json | null
          sms_sender_id: string | null
          sub_county: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          county?: string | null
          created_at?: string
          curriculum_type?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          paybill_number?: string | null
          phone?: string | null
          settings?: Json | null
          sms_sender_id?: string | null
          sub_county?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          county?: string | null
          created_at?: string
          curriculum_type?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          paybill_number?: string | null
          phone?: string | null
          settings?: Json | null
          sms_sender_id?: string | null
          sub_county?: string | null
          subscription_status?: string | null
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
      staff: {
        Row: {
          account_title: string | null
          address: string | null
          bank_account_number: string | null
          bank_branch_name: string | null
          bank_name: string | null
          basic_salary: number | null
          contract_type: string | null
          created_at: string
          date_of_birth: string | null
          date_of_joining: string | null
          department_id: string | null
          designation_id: string | null
          email: string | null
          emergency_contact: string | null
          epf_no: string | null
          facebook_url: string | null
          father_name: string | null
          first_name: string
          gender: string | null
          id: string
          ifsc_code: string | null
          instagram_url: string | null
          last_name: string | null
          linkedin_url: string | null
          marital_status: string | null
          maternity_leave_quota: number | null
          medical_leave_quota: number | null
          mother_name: string | null
          note: string | null
          other_leave_quota: number | null
          paternity_leave_quota: number | null
          permanent_address: string | null
          phone: string | null
          photo_url: string | null
          qualification: string | null
          role: string | null
          school_id: string
          staff_id_number: string
          status: string
          twitter_url: string | null
          updated_at: string
          user_id: string | null
          work_experience: string | null
          work_location: string | null
          work_shift: string | null
        }
        Insert: {
          account_title?: string | null
          address?: string | null
          bank_account_number?: string | null
          bank_branch_name?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          contract_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_joining?: string | null
          department_id?: string | null
          designation_id?: string | null
          email?: string | null
          emergency_contact?: string | null
          epf_no?: string | null
          facebook_url?: string | null
          father_name?: string | null
          first_name: string
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          instagram_url?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          marital_status?: string | null
          maternity_leave_quota?: number | null
          medical_leave_quota?: number | null
          mother_name?: string | null
          note?: string | null
          other_leave_quota?: number | null
          paternity_leave_quota?: number | null
          permanent_address?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          role?: string | null
          school_id: string
          staff_id_number: string
          status?: string
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          work_experience?: string | null
          work_location?: string | null
          work_shift?: string | null
        }
        Update: {
          account_title?: string | null
          address?: string | null
          bank_account_number?: string | null
          bank_branch_name?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          contract_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_joining?: string | null
          department_id?: string | null
          designation_id?: string | null
          email?: string | null
          emergency_contact?: string | null
          epf_no?: string | null
          facebook_url?: string | null
          father_name?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          instagram_url?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          marital_status?: string | null
          maternity_leave_quota?: number | null
          medical_leave_quota?: number | null
          mother_name?: string | null
          note?: string | null
          other_leave_quota?: number | null
          paternity_leave_quota?: number | null
          permanent_address?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          role?: string | null
          school_id?: string
          staff_id_number?: string
          status?: string
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          work_experience?: string | null
          work_location?: string | null
          work_shift?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_designation_id_fkey"
            columns: ["designation_id"]
            isOneToOne: false
            referencedRelation: "designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          recorded_by: string | null
          school_id: string
          staff_id: string
          status: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          school_id: string
          staff_id: string
          status?: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          school_id?: string
          staff_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_documents: {
        Row: {
          created_at: string
          document_type: string
          file_url: string | null
          id: string
          school_id: string
          staff_id: string
          title: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          file_url?: string | null
          id?: string
          school_id: string
          staff_id: string
          title: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string | null
          id?: string
          school_id?: string
          staff_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      streams: {
        Row: {
          academic_year_id: string
          capacity: number | null
          class_teacher_id: string | null
          created_at: string | null
          grade_id: string
          id: string
          name: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string | null
          grade_id: string
          id?: string
          name: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string | null
          grade_id?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streams_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streams_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streams_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_year_id: string
          created_at: string | null
          enrolled_at: string | null
          grade_id: string
          id: string
          promoted_from_id: string | null
          promotion_status: string | null
          school_id: string
          stream_id: string | null
          student_id: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string | null
          enrolled_at?: string | null
          grade_id: string
          id?: string
          promoted_from_id?: string | null
          promotion_status?: string | null
          school_id: string
          stream_id?: string | null
          student_id: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          grade_id?: string
          id?: string
          promoted_from_id?: string | null
          promotion_status?: string | null
          school_id?: string
          stream_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_promoted_from_id_fkey"
            columns: ["promoted_from_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
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
      student_parents: {
        Row: {
          created_at: string | null
          id: string
          is_fee_payer: boolean | null
          is_primary_contact: boolean | null
          parent_id: string
          relationship: Database["public"]["Enums"]["relationship_type"]
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_fee_payer?: boolean | null
          is_primary_contact?: boolean | null
          parent_id: string
          relationship: Database["public"]["Enums"]["relationship_type"]
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_fee_payer?: boolean | null
          is_primary_contact?: boolean | null
          parent_id?: string
          relationship?: Database["public"]["Enums"]["relationship_type"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_transport_assignments: {
        Row: {
          academic_year_id: string
          billing_type: string | null
          created_at: string | null
          dropoff_stop: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          pickup_stop: string | null
          route_id: string
          school_id: string
          start_date: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          billing_type?: string | null
          created_at?: string | null
          dropoff_stop?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          pickup_stop?: string | null
          route_id: string
          school_id: string
          start_date: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          billing_type?: string | null
          created_at?: string | null
          dropoff_stop?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          pickup_stop?: string | null
          route_id?: string
          school_id?: string
          start_date?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_transport_assignments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_assignments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          admission_date: string | null
          admission_number: string
          cbc_pathway: string | null
          created_at: string
          current_grade_id: string | null
          current_stream_id: string | null
          current_term_id: string | null
          date_of_birth: string | null
          first_name: string
          full_name: string | null
          gender: string | null
          grade: string | null
          graduation_date: string | null
          id: string
          last_name: string
          medical_info: Json | null
          middle_name: string | null
          nationality: string | null
          parent_name: string | null
          parent_phone: string | null
          photo_url: string | null
          previous_school: string | null
          religion: string | null
          school_id: string
          special_needs: string | null
          status: string
          stream: string | null
          updated_at: string
          upi: string | null
          user_id: string | null
        }
        Insert: {
          admission_date?: string | null
          admission_number: string
          cbc_pathway?: string | null
          created_at?: string
          current_grade_id?: string | null
          current_stream_id?: string | null
          current_term_id?: string | null
          date_of_birth?: string | null
          first_name: string
          full_name?: string | null
          gender?: string | null
          grade?: string | null
          graduation_date?: string | null
          id?: string
          last_name: string
          medical_info?: Json | null
          middle_name?: string | null
          nationality?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          previous_school?: string | null
          religion?: string | null
          school_id: string
          special_needs?: string | null
          status?: string
          stream?: string | null
          updated_at?: string
          upi?: string | null
          user_id?: string | null
        }
        Update: {
          admission_date?: string | null
          admission_number?: string
          cbc_pathway?: string | null
          created_at?: string
          current_grade_id?: string | null
          current_stream_id?: string | null
          current_term_id?: string | null
          date_of_birth?: string | null
          first_name?: string
          full_name?: string | null
          gender?: string | null
          grade?: string | null
          graduation_date?: string | null
          id?: string
          last_name?: string
          medical_info?: Json | null
          middle_name?: string | null
          nationality?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          photo_url?: string | null
          previous_school?: string | null
          religion?: string | null
          school_id?: string
          special_needs?: string | null
          status?: string
          stream?: string | null
          updated_at?: string
          upi?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_current_grade_id_fkey"
            columns: ["current_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_current_stream_id_fkey"
            columns: ["current_stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
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
          status: string | null
          term_number: number | null
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
          status?: string | null
          term_number?: number | null
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
          status?: string | null
          term_number?: number | null
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
      transport_fees: {
        Row: {
          academic_year_id: string
          amount: number
          amount_paid: number | null
          assignment_id: string
          balance: number | null
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          due_date: string | null
          id: string
          school_id: string
          status: string | null
          student_id: string
          term_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          amount?: number
          amount_paid?: number | null
          assignment_id: string
          balance?: number | null
          billing_period_end: string
          billing_period_start: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          school_id: string
          status?: string | null
          student_id: string
          term_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          amount?: number
          amount_paid?: number | null
          assignment_id?: string
          balance?: number | null
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          school_id?: string
          status?: string | null
          student_id?: string
          term_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_fees_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_fees_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "student_transport_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_fees_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_payment_allocations: {
        Row: {
          allocated_at: string | null
          amount: number
          created_at: string | null
          id: string
          payment_id: string
          transport_fee_id: string
        }
        Insert: {
          allocated_at?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_id: string
          transport_fee_id: string
        }
        Update: {
          allocated_at?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_id?: string
          transport_fee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_payment_allocations_transport_fee_id_fkey"
            columns: ["transport_fee_id"]
            isOneToOne: false
            referencedRelation: "transport_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          attendant_id: string | null
          created_at: string | null
          description: string | null
          driver_id: string | null
          id: string
          is_active: boolean | null
          monthly_fee: number
          name: string
          per_term_fee: number | null
          school_id: string
          stops: Json | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          attendant_id?: string | null
          created_at?: string | null
          description?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number
          name: string
          per_term_fee?: number | null
          school_id: string
          stops?: Json | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          attendant_id?: string | null
          created_at?: string | null
          description?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number
          name?: string
          per_term_fee?: number | null
          school_id?: string
          stops?: Json | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_routes_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_routes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_routes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
      user_roles: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          inspection_expiry: string | null
          insurance_expiry: string | null
          is_active: boolean | null
          make: string | null
          model: string | null
          registration_number: string
          school_id: string
          updated_at: string | null
          year_of_manufacture: number | null
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          id?: string
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          is_active?: boolean | null
          make?: string | null
          model?: string | null
          registration_number: string
          school_id: string
          updated_at?: string | null
          year_of_manufacture?: number | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          is_active?: boolean | null
          make?: string | null
          model?: string | null
          registration_number?: string
          school_id?: string
          updated_at?: string | null
          year_of_manufacture?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_carry_forwards_for_term: {
        Args: {
          p_from_term_id: string
          p_school_id: string
          p_to_term_id: string
        }
        Returns: {
          applied_count: number
          failed_count: number
          total_arrears: number
          total_credits: number
        }[]
      }
      apply_fee_adjustment: {
        Args: {
          p_adjustment_type: string
          p_amount: number
          p_approved_by?: string
          p_created_by: string
          p_reason: string
          p_school_id: string
          p_student_fee_id: string
        }
        Returns: undefined
      }
      apply_fee_discount: {
        Args: {
          p_applied_by: string
          p_discount_id: string
          p_student_fee_id: string
        }
        Returns: number
      }
      calculate_brought_forward: {
        Args: {
          p_ledger_type: string
          p_new_term_id: string
          p_student_id: string
        }
        Returns: {
          arrears: number
          credit: number
        }[]
      }
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
          bank_name: string | null
          bank_reference: string | null
          cheque_date: string | null
          cheque_number: string | null
          created_at: string
          id: string
          is_reconciled: boolean | null
          ledger_type: string
          mpesa_phone: string | null
          mpesa_receipt: string | null
          mpesa_transaction_id: string | null
          notes: string | null
          parent_id: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_method: string
          receipt_url: string | null
          received_at: string
          reconciled_at: string | null
          reconciled_by: string | null
          recorded_by: string | null
          reference_number: string | null
          school_id: string
          status: string
          student_id: string
          transaction_date: string | null
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
      get_accessible_schools: { Args: { _user_id: string }; Returns: string[] }
      get_student_balance: {
        Args: { p_ledger_type?: string; p_student_id: string }
        Returns: number
      }
      get_user_roles: {
        Args: { _school_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_permission: {
        Args: { _permission_code: string; _school_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_school: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _school_id: string
          _user_id: string
        }
        Returns: boolean
      }
      increment_fee_payment: {
        Args: { fee_id: string; payment_amount: number }
        Returns: undefined
      }
      next_receipt_number: { Args: { p_school_id: string }; Returns: string }
      release_advisory_lock: { Args: { lock_key: number }; Returns: boolean }
      reverse_payment: {
        Args: { _payment_id: string; _reason: string }
        Returns: Json
      }
      try_advisory_lock: { Args: { lock_key: number }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "school_admin"
        | "deputy_admin"
        | "teacher"
        | "finance_officer"
        | "front_office"
        | "transport_officer"
        | "store_manager"
        | "pos_attendant"
        | "student"
        | "parent"
        | "auditor"
      education_level:
        | "pre_primary"
        | "lower_primary"
        | "upper_primary"
        | "junior_secondary"
        | "senior_secondary"
        | "primary_844"
        | "secondary_844"
      permission_category:
        | "students"
        | "academics"
        | "finance"
        | "transport"
        | "inventory"
        | "pos"
        | "reports"
        | "settings"
        | "users"
      relationship_type:
        | "father"
        | "mother"
        | "guardian"
        | "sponsor"
        | "grandparent"
        | "sibling"
        | "other"
      student_status:
        | "applicant"
        | "admitted"
        | "active"
        | "suspended"
        | "transferred"
        | "graduated"
        | "alumni"
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
    Enums: {
      app_role: [
        "super_admin",
        "school_admin",
        "deputy_admin",
        "teacher",
        "finance_officer",
        "front_office",
        "transport_officer",
        "store_manager",
        "pos_attendant",
        "student",
        "parent",
        "auditor",
      ],
      education_level: [
        "pre_primary",
        "lower_primary",
        "upper_primary",
        "junior_secondary",
        "senior_secondary",
        "primary_844",
        "secondary_844",
      ],
      permission_category: [
        "students",
        "academics",
        "finance",
        "transport",
        "inventory",
        "pos",
        "reports",
        "settings",
        "users",
      ],
      relationship_type: [
        "father",
        "mother",
        "guardian",
        "sponsor",
        "grandparent",
        "sibling",
        "other",
      ],
      student_status: [
        "applicant",
        "admitted",
        "active",
        "suspended",
        "transferred",
        "graduated",
        "alumni",
      ],
    },
  },
} as const
