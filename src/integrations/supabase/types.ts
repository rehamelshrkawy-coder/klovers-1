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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievement_milestones: {
        Row: {
          achieved_at: string | null
          created_at: string | null
          id: number
          is_achieved: boolean | null
          milestone_name: string
          milestone_tier: number
          milestone_type: string
          progress_value: number | null
          target_value: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string | null
          id?: number
          is_achieved?: boolean | null
          milestone_name: string
          milestone_tier: number
          milestone_type: string
          progress_value?: number | null
          target_value: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string | null
          id?: number
          is_achieved?: boolean | null
          milestone_name?: string
          milestone_tier?: number
          milestone_type?: string
          progress_value?: number | null
          target_value?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "achievement_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "achievement_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_attendance_log: {
        Row: {
          created_at: string
          created_by: string
          enrollment_id: string
          id: string
          session_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          enrollment_id: string
          id?: string
          session_date: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          enrollment_id?: string
          id?: string
          session_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_attendance_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "admin_attendance_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "admin_attendance_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          enrollment_id: string | null
          field: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          enrollment_id?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          enrollment_id?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_group_id: string | null
          related_user_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_group_id?: string | null
          related_user_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_group_id?: string | null
          related_user_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_related_group_id_fkey"
            columns: ["related_group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      attendance_log: {
        Row: {
          id: string
          marked_at: string
          marked_by: string
          notes: string | null
          package_id: string | null
          session_date: string | null
          student_id: string
        }
        Insert: {
          id?: string
          marked_at?: string
          marked_by: string
          notes?: string | null
          package_id?: string | null
          session_date?: string | null
          student_id: string
        }
        Update: {
          id?: string
          marked_at?: string
          marked_by?: string
          notes?: string | null
          package_id?: string | null
          session_date?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_log_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "student_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_requests: {
        Row: {
          created_at: string
          enrollment_id: string
          id: string
          request_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          id?: string
          request_date: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          id?: string
          request_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "attendance_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "attendance_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_members: {
        Row: {
          added_at: string
          batch_id: string
          enrollment_id: string
          id: string
          member_status: string
          user_id: string
        }
        Insert: {
          added_at?: string
          batch_id: string
          enrollment_id: string
          id?: string
          member_status?: string
          user_id: string
        }
        Update: {
          added_at?: string
          batch_id?: string
          enrollment_id?: string
          id?: string
          member_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_members_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_members_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "batch_members_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "batch_members_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          capacity: number
          course_id: string
          created_at: string
          id: string
          level: string
          status: string
        }
        Insert: {
          capacity?: number
          course_id: string
          created_at?: string
          id?: string
          level?: string
          status?: string
        }
        Update: {
          capacity?: number
          course_id?: string
          created_at?: string
          id?: string
          level?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "batches_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      blog_comments: {
        Row: {
          approved: boolean
          author_name: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          approved?: boolean
          author_name: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          approved?: boolean
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          article_type: string
          author: string
          content: string
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string
          featured: boolean
          hero_alt: string | null
          hero_alt_2: string | null
          hero_caption: string | null
          hero_caption_2: string | null
          hero_image: string | null
          hero_image_2: string | null
          id: string
          keywords: string[] | null
          lang: string
          published: boolean
          published_at: string | null
          seo_priority: number
          seo_score: number | null
          slug: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          article_type?: string
          author?: string
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string
          featured?: boolean
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string
          keywords?: string[] | null
          lang?: string
          published?: boolean
          published_at?: string | null
          seo_priority?: number
          seo_score?: number | null
          slug: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          article_type?: string
          author?: string
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string
          featured?: boolean
          hero_alt?: string | null
          hero_alt_2?: string | null
          hero_caption?: string | null
          hero_caption_2?: string | null
          hero_image?: string | null
          hero_image_2?: string | null
          id?: string
          keywords?: string[] | null
          lang?: string
          published?: boolean
          published_at?: string | null
          seo_priority?: number
          seo_score?: number | null
          slug?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      book_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          available_from: string
          book_id: string
          enrollment_id: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          available_from: string
          book_id?: string
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          available_from?: string
          book_id?: string
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_assignments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "book_assignments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "book_assignments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_recovery_emails: {
        Row: {
          clicked_at: string | null
          converted_at: string | null
          created_at: string
          email: string
          error_message: string | null
          id: string
          lead_id: string
          opened_at: string | null
          provider_message_id: string | null
          scheduled_for: string | null
          send_status: string
          sent_at: string | null
          stage: number
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          lead_id: string
          opened_at?: string | null
          provider_message_id?: string | null
          scheduled_for?: string | null
          send_status?: string
          sent_at?: string | null
          stage: number
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          opened_at?: string | null
          provider_message_id?: string | null
          scheduled_for?: string | null
          send_status?: string
          sent_at?: string | null
          stage?: number
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_recovery_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "checkout_recovery_tracker"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "checkout_recovery_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      course_levels: {
        Row: {
          created_at: string
          display_label: string
          is_active: boolean
          key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_label: string
          is_active?: boolean
          key: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_label?: string
          is_active?: boolean
          key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          currency: string
          id: string
          level: string
          price_amount: number
          sessions_included: number
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          level?: string
          price_amount?: number
          sessions_included?: number
          title: string
          type: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          level?: string
          price_amount?: number
          sessions_included?: number
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "courses_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      egp_prices: {
        Row: {
          amount_egp: number
          duration: number
          plan_type: string
        }
        Insert: {
          amount_egp: number
          duration: number
          plan_type: string
        }
        Update: {
          amount_egp?: number
          duration?: number
          plan_type?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          created_at: string
          created_by: string
          html_body: string
          id: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          created_by: string
          html_body: string
          id?: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          created_by?: string
          html_body?: string
          id?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          complained_at: string | null
          created_at: string | null
          delivered_at: string | null
          enrollment_id: string | null
          error: string | null
          id: string
          resend_id: string | null
          status: string
          template: string
          to_email: string
          to_name: string | null
        }
        Insert: {
          bounced_at?: string | null
          complained_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          enrollment_id?: string | null
          error?: string | null
          id?: string
          resend_id?: string | null
          status: string
          template: string
          to_email: string
          to_name?: string | null
        }
        Update: {
          bounced_at?: string | null
          complained_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          enrollment_id?: string | null
          error?: string | null
          id?: string
          resend_id?: string | null
          status?: string
          template?: string
          to_email?: string
          to_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "email_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "email_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          attempts: number
          campaign_id: string
          created_at: string
          email: string
          error: string | null
          id: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          attempts?: number
          campaign_id: string
          created_at?: string
          email: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          attempts?: number
          campaign_id?: string
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          acquisition_source: string | null
          admin_notes: string | null
          admin_review_required: boolean
          amount: number
          approval_email_sent_at: string | null
          approval_status: string
          assigned_day: string | null
          assigned_time: string | null
          assigned_timezone: string | null
          class_feedback_sent_at: string | null
          class_link_sent_at: string | null
          classes_included: number
          created_at: string
          currency: string
          deleted_at: string | null
          deleted_by: string | null
          due_at: string | null
          duration: number
          enrollment_status: string
          first_class_date: string | null
          forming_email_sent_at: string | null
          forming_escalation_sent_at: string | null
          id: string
          last_reminder_at: string | null
          level: string | null
          matched_at: string | null
          matched_batch_id: string | null
          negative_since: string | null
          package_id: string | null
          payment_date: string | null
          payment_email_sent_at: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string
          plan_type: string
          pre_class_reminder_sent_at: string | null
          preferred_day: string | null
          preferred_days: string[] | null
          preferred_start: string | null
          preferred_time: string | null
          receipt_nudge_sent_at: string | null
          receipt_url: string
          rejection_followup_sent_at: string | null
          reminder_count: number
          reviewed_at: string | null
          reviewed_by: string | null
          sessions_remaining: number
          sessions_total: number
          slot_id: string | null
          slot_rejection_at: string | null
          slot_rejection_reason: string | null
          status: string
          stripe_payment_intent_id: string | null
          timezone: string | null
          tx_ref: string
          unit_price: number
          user_id: string
        }
        Insert: {
          acquisition_source?: string | null
          admin_notes?: string | null
          admin_review_required?: boolean
          amount: number
          approval_email_sent_at?: string | null
          approval_status?: string
          assigned_day?: string | null
          assigned_time?: string | null
          assigned_timezone?: string | null
          class_feedback_sent_at?: string | null
          class_link_sent_at?: string | null
          classes_included: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          due_at?: string | null
          duration: number
          enrollment_status?: string
          first_class_date?: string | null
          forming_email_sent_at?: string | null
          forming_escalation_sent_at?: string | null
          id?: string
          last_reminder_at?: string | null
          level?: string | null
          matched_at?: string | null
          matched_batch_id?: string | null
          negative_since?: string | null
          package_id?: string | null
          payment_date?: string | null
          payment_email_sent_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          plan_type: string
          pre_class_reminder_sent_at?: string | null
          preferred_day?: string | null
          preferred_days?: string[] | null
          preferred_start?: string | null
          preferred_time?: string | null
          receipt_nudge_sent_at?: string | null
          receipt_url: string
          rejection_followup_sent_at?: string | null
          reminder_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_remaining?: number
          sessions_total?: number
          slot_id?: string | null
          slot_rejection_at?: string | null
          slot_rejection_reason?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          timezone?: string | null
          tx_ref: string
          unit_price: number
          user_id: string
        }
        Update: {
          acquisition_source?: string | null
          admin_notes?: string | null
          admin_review_required?: boolean
          amount?: number
          approval_email_sent_at?: string | null
          approval_status?: string
          assigned_day?: string | null
          assigned_time?: string | null
          assigned_timezone?: string | null
          class_feedback_sent_at?: string | null
          class_link_sent_at?: string | null
          classes_included?: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          due_at?: string | null
          duration?: number
          enrollment_status?: string
          first_class_date?: string | null
          forming_email_sent_at?: string | null
          forming_escalation_sent_at?: string | null
          id?: string
          last_reminder_at?: string | null
          level?: string | null
          matched_at?: string | null
          matched_batch_id?: string | null
          negative_since?: string | null
          package_id?: string | null
          payment_date?: string | null
          payment_email_sent_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          plan_type?: string
          pre_class_reminder_sent_at?: string | null
          preferred_day?: string | null
          preferred_days?: string[] | null
          preferred_start?: string | null
          preferred_time?: string | null
          receipt_nudge_sent_at?: string | null
          receipt_url?: string
          rejection_followup_sent_at?: string | null
          reminder_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_remaining?: number
          sessions_total?: number
          slot_id?: string | null
          slot_rejection_at?: string | null
          slot_rejection_reason?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          timezone?: string | null
          tx_ref?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "enrollments_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "fk_enrollments_matched_batch"
            columns: ["matched_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      group_attendance: {
        Row: {
          admin_approved: boolean
          created_at: string
          id: string
          session_id: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          admin_approved?: boolean
          created_at?: string
          id?: string
          session_id: string
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_approved?: boolean
          created_at?: string
          id?: string
          session_id?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      group_sessions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          session_date: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          session_date: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          session_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_training_sessions: {
        Row: {
          created_at: string
          free_used: number
          id: string
          industry: string | null
          job_title: string
          languages_spoken: string[] | null
          paid_purchased: number
          payment_status: string | null
          questions: Json | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
          created_at?: string
          free_used?: number
          id?: string
          industry?: string | null
          job_title: string
          languages_spoken?: string[] | null
          paid_purchased?: number
          payment_status?: string | null
          questions?: Json | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
          created_at?: string
          free_used?: number
          id?: string
          industry?: string | null
          job_title?: string
          languages_spoken?: string[] | null
          paid_purchased?: number
          payment_status?: string | null
          questions?: Json | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          campaign: string | null
          created_at: string
          cta_label: string | null
          id: string
          metadata: Json | null
          referrer: string | null
          session_id: string
          source_page: string
          source_type: string
          user_id: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          cta_label?: string | null
          id?: string
          metadata?: Json | null
          referrer?: string | null
          session_id: string
          source_page: string
          source_type: string
          user_id?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          campaign?: string | null
          created_at?: string
          cta_label?: string | null
          id?: string
          metadata?: Json | null
          referrer?: string | null
          session_id?: string
          source_page?: string
          source_type?: string
          user_id?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          country: string | null
          created_at: string
          duration: string | null
          email: string
          goal: string | null
          id: string
          level: string | null
          name: string
          plan_type: string | null
          schedule: string | null
          source: string | null
          status: string
          timezone: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          duration?: string | null
          email: string
          goal?: string | null
          id?: string
          level?: string | null
          name: string
          plan_type?: string | null
          schedule?: string | null
          source?: string | null
          status?: string
          timezone?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          duration?: string | null
          email?: string
          goal?: string | null
          id?: string
          level?: string | null
          name?: string
          plan_type?: string | null
          schedule?: string | null
          source?: string | null
          status?: string
          timezone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "leads_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      lesson_dialogues: {
        Row: {
          english: string
          id: string
          korean: string
          lesson_id: number
          romanization: string
          sort_order: number
          speaker: string
        }
        Insert: {
          english: string
          id?: string
          korean: string
          lesson_id: number
          romanization?: string
          sort_order?: number
          speaker: string
        }
        Update: {
          english?: string
          id?: string
          korean?: string
          lesson_id?: number
          romanization?: string
          sort_order?: number
          speaker?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_dialogues_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_exercises: {
        Row: {
          correct_index: number
          explanation: string
          id: string
          lesson_id: number
          options: Json
          question: string
          sort_order: number
        }
        Insert: {
          correct_index?: number
          explanation?: string
          id?: string
          lesson_id: number
          options?: Json
          question: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          explanation?: string
          id?: string
          lesson_id?: number
          options?: Json
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_grammar: {
        Row: {
          examples: Json
          explanation: string
          id: string
          lesson_id: number
          sort_order: number
          structure: string
          title: string
        }
        Insert: {
          examples?: Json
          explanation?: string
          id?: string
          lesson_id: number
          sort_order?: number
          structure?: string
          title: string
        }
        Update: {
          examples?: Json
          explanation?: string
          id?: string
          lesson_id?: number
          sort_order?: number
          structure?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_grammar_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reading: {
        Row: {
          english_text: string
          id: string
          korean_text: string
          lesson_id: number
          sort_order: number
        }
        Insert: {
          english_text?: string
          id?: string
          korean_text: string
          lesson_id: number
          sort_order?: number
        }
        Update: {
          english_text?: string
          id?: string
          korean_text?: string
          lesson_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reading_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_vocabulary: {
        Row: {
          id: string
          image_url: string | null
          korean: string
          lesson_id: number
          meaning: string
          meaning_ar: string | null
          romanization: string
          sort_order: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          korean: string
          lesson_id: number
          meaning: string
          meaning_ar?: string | null
          romanization?: string
          sort_order?: number
        }
        Update: {
          id?: string
          image_url?: string | null
          korean?: string
          lesson_id?: number
          meaning?: string
          meaning_ar?: string | null
          romanization?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_vocabulary_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      level_group_config: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          level: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          level: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          level?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "level_group_config_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_group_config_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "level_group_config_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      level_slot_config: {
        Row: {
          created_at: string | null
          id: string
          level: string
          slot_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          slot_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          slot_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "level_slot_config_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "level_slot_config_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "level_slot_config_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          ad_primary_text: string
          campaign_name: string | null
          caption_text: string
          created_at: string
          description: string
          group_id: string | null
          headline: string
          id: string
          image_url_1x1: string | null
          image_url_4x5: string | null
          image_url_story: string | null
          post_order: number | null
          scheduled_date: string | null
          status: string
          video_url: string | null
        }
        Insert: {
          ad_primary_text?: string
          campaign_name?: string | null
          caption_text?: string
          created_at?: string
          description?: string
          group_id?: string | null
          headline?: string
          id?: string
          image_url_1x1?: string | null
          image_url_4x5?: string | null
          image_url_story?: string | null
          post_order?: number | null
          scheduled_date?: string | null
          status?: string
          video_url?: string | null
        }
        Update: {
          ad_primary_text?: string
          campaign_name?: string | null
          caption_text?: string
          created_at?: string
          description?: string
          group_id?: string | null
          headline?: string
          id?: string
          image_url_1x1?: string | null
          image_url_4x5?: string | null
          image_url_story?: string | null
          post_order?: number | null
          scheduled_date?: string | null
          status?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pkg_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_slots: {
        Row: {
          course_level: string
          created_at: string
          current_count: number
          day: string
          id: string
          max_students: number
          min_students: number
          package_id: string | null
          status: string
          time: string
          timezone: string
        }
        Insert: {
          course_level?: string
          created_at?: string
          current_count?: number
          day: string
          id?: string
          max_students?: number
          min_students?: number
          package_id?: string | null
          status?: string
          time: string
          timezone?: string
        }
        Update: {
          course_level?: string
          created_at?: string
          current_count?: number
          day?: string
          id?: string
          max_students?: number
          min_students?: number
          package_id?: string | null
          status?: string
          time?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_slots_course_level_fkey_course_levels"
            columns: ["course_level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "matching_slots_course_level_fkey_course_levels"
            columns: ["course_level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "matching_slots_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "schedule_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      pkg_attendance: {
        Row: {
          admin_approved: boolean
          created_at: string
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          admin_approved?: boolean
          created_at?: string
          session_id: string
          status?: string
          user_id: string
        }
        Update: {
          admin_approved?: boolean
          created_at?: string
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pkg_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pkg_group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pkg_class_charges: {
        Row: {
          charge_type: string
          created_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          charge_type?: string
          created_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          charge_type?: string
          created_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pkg_class_charges_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pkg_group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pkg_group_members: {
        Row: {
          enrollment_id: string | null
          group_id: string
          joined_at: string
          member_status: string
          user_id: string
        }
        Insert: {
          enrollment_id?: string | null
          group_id: string
          joined_at?: string
          member_status?: string
          user_id: string
        }
        Update: {
          enrollment_id?: string | null
          group_id?: string
          joined_at?: string
          member_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pkg_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pkg_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      pkg_group_sessions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          session_date: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          session_date: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          session_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "pkg_group_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pkg_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      pkg_groups: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          package_id: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          package_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pkg_groups_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "schedule_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_tests: {
        Row: {
          created_at: string
          id: string
          level: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_tests_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "placement_tests_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string
          course_level_key: string | null
          created_at: string
          credits: number
          email: string
          email_unsubscribed: boolean
          id: string
          language: string | null
          level: string | null
          name: string
          name_reminder_sent_at: string | null
          reset_version: string | null
          status: string
          timezone: string | null
          unsubscribe_token: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string
          course_level_key?: string | null
          created_at?: string
          credits?: number
          email: string
          email_unsubscribed?: boolean
          id?: string
          language?: string | null
          level?: string | null
          name: string
          name_reminder_sent_at?: string | null
          reset_version?: string | null
          status?: string
          timezone?: string | null
          unsubscribe_token?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string
          course_level_key?: string | null
          created_at?: string
          credits?: number
          email?: string
          email_unsubscribed?: boolean
          id?: string
          language?: string | null
          level?: string | null
          name?: string
          name_reminder_sent_at?: string | null
          reset_version?: string | null
          status?: string
          timezone?: string | null
          unsubscribe_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_course_level_key_fkey_course_levels"
            columns: ["course_level_key"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "profiles_course_level_key_fkey_course_levels"
            columns: ["course_level_key"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "profiles_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "profiles_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          currency: string | null
          description: string | null
          discount_flat: number | null
          discount_pct: number | null
          expires_at: string | null
          id: string
          max_uses: number | null
          uses_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_flat?: number | null
          discount_pct?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_flat?: number | null
          discount_pct?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          clicked_at: string
          id: string
          referrer_user_id: string
          visitor_fingerprint: string
        }
        Insert: {
          clicked_at?: string
          id?: string
          referrer_user_id: string
          visitor_fingerprint: string
        }
        Update: {
          clicked_at?: string
          id?: string
          referrer_user_id?: string
          visitor_fingerprint?: string
        }
        Relationships: []
      }
      referral_conversions: {
        Row: {
          converted_at: string
          id: string
          referred_email: string
          referrer_user_id: string
          xp_awarded: boolean
        }
        Insert: {
          converted_at?: string
          id?: string
          referred_email: string
          referrer_user_id: string
          xp_awarded?: boolean
        }
        Update: {
          converted_at?: string
          id?: string
          referred_email?: string
          referrer_user_id?: string
          xp_awarded?: boolean
        }
        Relationships: []
      }
      schedule_options: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      schedule_packages: {
        Row: {
          capacity: number
          course_type: string
          created_at: string
          day_of_week: number
          duration_min: number
          id: string
          is_active: boolean
          level: string
          start_time: string
          timezone: string
        }
        Insert: {
          capacity?: number
          course_type?: string
          created_at?: string
          day_of_week: number
          duration_min?: number
          id?: string
          is_active?: boolean
          level: string
          start_time?: string
          timezone?: string
        }
        Update: {
          capacity?: number
          course_type?: string
          created_at?: string
          day_of_week?: number
          duration_min?: number
          id?: string
          is_active?: boolean
          level?: string
          start_time?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_packages_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "schedule_packages_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      schedule_resubmission_requests: {
        Row: {
          created_at: string
          email: string
          enrollment_id: string
          expires_at: string
          id: string
          status: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          enrollment_id: string
          expires_at?: string
          id?: string
          status?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          enrollment_id?: string
          expires_at?: string
          id?: string
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_resubmission_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "schedule_resubmission_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "schedule_resubmission_requests_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_social_posts: {
        Row: {
          attempts: number
          caption: string
          course_title: string
          created_at: string
          created_by: string
          group_id: string | null
          id: string
          last_error: string | null
          meta_result: Json | null
          platforms: string[]
          posted_at: string | null
          registration_url: string | null
          scheduled_at: string
          status: string
        }
        Insert: {
          attempts?: number
          caption?: string
          course_title?: string
          created_at?: string
          created_by: string
          group_id?: string | null
          id?: string
          last_error?: string | null
          meta_result?: Json | null
          platforms?: string[]
          posted_at?: string | null
          registration_url?: string | null
          scheduled_at: string
          status?: string
        }
        Update: {
          attempts?: number
          caption?: string
          course_title?: string
          created_at?: string
          created_by?: string
          group_id?: string | null
          id?: string
          last_error?: string | null
          meta_result?: Json | null
          platforms?: string[]
          posted_at?: string | null
          registration_url?: string | null
          scheduled_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_social_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pkg_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_video_cache: {
        Row: {
          fetched_at: string
          id: string
          post_type: string
          query: string
          results: Json
        }
        Insert: {
          fetched_at?: string
          id?: string
          post_type: string
          query: string
          results: Json
        }
        Update: {
          fetched_at?: string
          id?: string
          post_type?: string
          query?: string
          results?: Json
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          badge_key: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      student_groups: {
        Row: {
          capacity: number | null
          course_type: string | null
          created_at: string
          id: string
          level: string | null
          name: string
          schedule_day: string | null
          schedule_time: string | null
          schedule_timezone: string | null
        }
        Insert: {
          capacity?: number | null
          course_type?: string | null
          created_at?: string
          id?: string
          level?: string | null
          name: string
          schedule_day?: string | null
          schedule_time?: string | null
          schedule_timezone?: string | null
        }
        Update: {
          capacity?: number | null
          course_type?: string | null
          created_at?: string
          id?: string
          level?: string | null
          name?: string
          schedule_day?: string | null
          schedule_time?: string | null
          schedule_timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_groups_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_groups_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      student_lesson_progress: {
        Row: {
          chapter_completed: boolean
          completed_at: string | null
          dialogue_done: boolean
          exercises_done: boolean
          grammar_done: boolean
          lesson_id: number
          reading_done: boolean
          user_id: string
          vocab_done: boolean
          writing_done: boolean
        }
        Insert: {
          chapter_completed?: boolean
          completed_at?: string | null
          dialogue_done?: boolean
          exercises_done?: boolean
          grammar_done?: boolean
          lesson_id: number
          reading_done?: boolean
          user_id: string
          vocab_done?: boolean
          writing_done?: boolean
        }
        Update: {
          chapter_completed?: boolean
          completed_at?: string | null
          dialogue_done?: boolean
          exercises_done?: boolean
          grammar_done?: boolean
          lesson_id?: number
          reading_done?: boolean
          user_id?: string
          vocab_done?: boolean
          writing_done?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      student_nps: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_package_preferences: {
        Row: {
          level: string
          package_id: string | null
          preferred_day_of_week: number | null
          preferred_start_time: string | null
          requested_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          level?: string
          package_id?: string | null
          preferred_day_of_week?: number | null
          preferred_start_time?: string | null
          requested_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          level?: string
          package_id?: string | null
          preferred_day_of_week?: number | null
          preferred_start_time?: string | null
          requested_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_package_preferences_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_package_preferences_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_package_preferences_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "schedule_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      student_packages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          package_name: string
          payment_status: string
          price_per_class: number
          student_id: string
          total_classes: number
          total_paid: number
          used_classes: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          package_name?: string
          payment_status?: string
          price_per_class?: number
          student_id: string
          total_classes?: number
          total_paid?: number
          used_classes?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          package_name?: string
          payment_status?: string
          price_per_class?: number
          student_id?: string
          total_classes?: number
          total_paid?: number
          used_classes?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_packages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_schedule_preferences: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_schedule_preferences_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedule_preferences_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_schedule_preferences_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      student_slot_preferences: {
        Row: {
          assigned_slot_id: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          match_status: string
          selected_level: string
          slot_1_id: string | null
          slot_2_id: string | null
          slot_3_id: string | null
          user_id: string
        }
        Insert: {
          assigned_slot_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          match_status?: string
          selected_level?: string
          slot_1_id?: string | null
          slot_2_id?: string | null
          slot_3_id?: string | null
          user_id: string
        }
        Update: {
          assigned_slot_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          match_status?: string
          selected_level?: string
          slot_1_id?: string | null
          slot_2_id?: string | null
          slot_3_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_slot_preferences_assigned_slot_id_fkey"
            columns: ["assigned_slot_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "admin_student_overview"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "student_slot_preferences_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["active_enrollment_id"]
          },
          {
            foreignKeyName: "student_slot_preferences_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_selected_level_fkey_course_levels"
            columns: ["selected_level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_slot_preferences_selected_level_fkey_course_levels"
            columns: ["selected_level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "student_slot_preferences_slot_1_id_fkey"
            columns: ["slot_1_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_slot_2_id_fkey"
            columns: ["slot_2_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_slot_preferences_slot_3_id_fkey"
            columns: ["slot_3_id"]
            isOneToOne: false
            referencedRelation: "matching_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      student_streaks: {
        Row: {
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          streak_14_earned: boolean
          streak_3_earned: boolean
          streak_30_earned: boolean
          streak_7_earned: boolean
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          streak_14_earned?: boolean
          streak_3_earned?: boolean
          streak_30_earned?: boolean
          streak_7_earned?: boolean
          user_id: string
        }
        Update: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          streak_14_earned?: boolean
          streak_3_earned?: boolean
          streak_30_earned?: boolean
          streak_7_earned?: boolean
          user_id?: string
        }
        Relationships: []
      }
      student_xp: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          lesson_id: number | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          lesson_id?: number | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          lesson_id?: number | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_xp_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "textbook_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          country: string | null
          course_type: string | null
          created_at: string
          email: string
          full_name: string
          group_name: string | null
          id: string
          notes: string | null
          package_name: string | null
          payment_status: string
          phone: string | null
          price_per_class: number
          remaining_classes: number | null
          status: string
          total_classes: number
          total_paid: number
          updated_at: string
          used_classes: number
        }
        Insert: {
          country?: string | null
          course_type?: string | null
          created_at?: string
          email: string
          full_name: string
          group_name?: string | null
          id?: string
          notes?: string | null
          package_name?: string | null
          payment_status?: string
          phone?: string | null
          price_per_class?: number
          remaining_classes?: number | null
          status?: string
          total_classes?: number
          total_paid?: number
          updated_at?: string
          used_classes?: number
        }
        Update: {
          country?: string | null
          course_type?: string | null
          created_at?: string
          email?: string
          full_name?: string
          group_name?: string | null
          id?: string
          notes?: string | null
          package_name?: string | null
          payment_status?: string
          phone?: string | null
          price_per_class?: number
          remaining_classes?: number | null
          status?: string
          total_classes?: number
          total_paid?: number
          updated_at?: string
          used_classes?: number
        }
        Relationships: []
      }
      system_reset_log: {
        Row: {
          admin_id: string
          created_at: string
          details: string | null
          id: string
          reset_type: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          details?: string | null
          id?: string
          reset_type?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reset_type?: string
        }
        Relationships: []
      }
      teacher_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          id: string
          is_available: boolean | null
          start_time: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: string
          is_available?: boolean | null
          start_time: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_available?: boolean | null
          start_time?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      textbook_lessons: {
        Row: {
          book: string
          created_at: string
          description: string
          description_ar: string
          emoji: string
          id: number
          is_published: boolean
          scene_image_url: string | null
          sort_order: number
          title_ar: string
          title_en: string
          title_ko: string
          topik_level: number
        }
        Insert: {
          book?: string
          created_at?: string
          description?: string
          description_ar?: string
          emoji?: string
          id?: number
          is_published?: boolean
          scene_image_url?: string | null
          sort_order?: number
          title_ar?: string
          title_en: string
          title_ko: string
          topik_level?: number
        }
        Update: {
          book?: string
          created_at?: string
          description?: string
          description_ar?: string
          emoji?: string
          id?: number
          is_published?: boolean
          scene_image_url?: string | null
          sort_order?: number
          title_ar?: string
          title_en?: string
          title_ko?: string
          topik_level?: number
        }
        Relationships: []
      }
      training_starred: {
        Row: {
          collections: Json
          id: string
          starred: number[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collections?: Json
          id?: string
          starred?: number[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collections?: Json
          id?: string
          starred?: number[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trial_bookings: {
        Row: {
          attendance_confirmed_at: string | null
          attendance_responded_at: string | null
          attendance_response: string | null
          calendar_url: string | null
          class_language: string
          confirmation_email_failed_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          day_of_week: number
          duration_min: number
          email: string
          email_opened_at: string | null
          email_sent_at: string | null
          followup_day1_sent_at: string | null
          followup_day3_sent_at: string | null
          followup_day7_sent_at: string | null
          followup_prep_sent_at: string | null
          goal: string | null
          id: string
          is_tba: boolean
          level: string | null
          name: string
          next_trial_month: string | null
          phone: string | null
          rebook_email_sent_at: string | null
          rollover_notified_at: string | null
          rollover_status: string | null
          slot_chosen_at: string | null
          start_time: string | null
          status: string | null
          timezone: string | null
          trial_date: string | null
          user_id: string | null
        }
        Insert: {
          attendance_confirmed_at?: string | null
          attendance_responded_at?: string | null
          attendance_response?: string | null
          calendar_url?: string | null
          class_language?: string
          confirmation_email_failed_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          day_of_week: number
          duration_min?: number
          email: string
          email_opened_at?: string | null
          email_sent_at?: string | null
          followup_day1_sent_at?: string | null
          followup_day3_sent_at?: string | null
          followup_day7_sent_at?: string | null
          followup_prep_sent_at?: string | null
          goal?: string | null
          id?: string
          is_tba?: boolean
          level?: string | null
          name: string
          next_trial_month?: string | null
          phone?: string | null
          rebook_email_sent_at?: string | null
          rollover_notified_at?: string | null
          rollover_status?: string | null
          slot_chosen_at?: string | null
          start_time?: string | null
          status?: string | null
          timezone?: string | null
          trial_date?: string | null
          user_id?: string | null
        }
        Update: {
          attendance_confirmed_at?: string | null
          attendance_responded_at?: string | null
          attendance_response?: string | null
          calendar_url?: string | null
          class_language?: string
          confirmation_email_failed_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          day_of_week?: number
          duration_min?: number
          email?: string
          email_opened_at?: string | null
          email_sent_at?: string | null
          followup_day1_sent_at?: string | null
          followup_day3_sent_at?: string | null
          followup_day7_sent_at?: string | null
          followup_prep_sent_at?: string | null
          goal?: string | null
          id?: string
          is_tba?: boolean
          level?: string | null
          name?: string
          next_trial_month?: string | null
          phone?: string | null
          rebook_email_sent_at?: string | null
          rollover_notified_at?: string | null
          rollover_status?: string | null
          slot_chosen_at?: string | null
          start_time?: string | null
          status?: string | null
          timezone?: string | null
          trial_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_bookings_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "trial_bookings_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      trial_broadcasts: {
        Row: {
          broadcast_key: string
          created_at: string
          error_count: number
          id: string
          sent_count: number
          triggered_by: string | null
        }
        Insert: {
          broadcast_key: string
          created_at?: string
          error_count?: number
          id?: string
          sent_count?: number
          triggered_by?: string | null
        }
        Update: {
          broadcast_key?: string
          created_at?: string
          error_count?: number
          id?: string
          sent_count?: number
          triggered_by?: string | null
        }
        Relationships: []
      }
      trial_invite_sends: {
        Row: {
          attendance_responded_at: string | null
          attendance_response: string | null
          campaign: string
          email: string
          email_opened_at: string | null
          id: string
          name: string | null
          sent_at: string
          source: string
        }
        Insert: {
          attendance_responded_at?: string | null
          attendance_response?: string | null
          campaign?: string
          email: string
          email_opened_at?: string | null
          id?: string
          name?: string | null
          sent_at?: string
          source: string
        }
        Update: {
          attendance_responded_at?: string | null
          attendance_response?: string | null
          campaign?: string
          email?: string
          email_opened_at?: string | null
          id?: string
          name?: string | null
          sent_at?: string
          source?: string
        }
        Relationships: []
      }
      trial_rate_limits: {
        Row: {
          action: string
          attempt_count: number
          id: string
          identifier: string
          last_attempt: string
          window_start: string
        }
        Insert: {
          action?: string
          attempt_count?: number
          id?: string
          identifier: string
          last_attempt?: string
          window_start: string
        }
        Update: {
          action?: string
          attempt_count?: number
          id?: string
          identifier?: string
          last_attempt?: string
          window_start?: string
        }
        Relationships: []
      }
      trial_settings: {
        Row: {
          default_duration_min: number
          id: number
          min_group_size: number
          program_start_date: string | null
          suggestion_weeks: number
          trial_block_days: number
          trial_block_start_dow: number
          updated_at: string
          window_end_day: number | null
          window_start_day: number | null
        }
        Insert: {
          default_duration_min?: number
          id?: number
          min_group_size?: number
          program_start_date?: string | null
          suggestion_weeks?: number
          trial_block_days?: number
          trial_block_start_dow?: number
          updated_at?: string
          window_end_day?: number | null
          window_start_day?: number | null
        }
        Update: {
          default_duration_min?: number
          id?: number
          min_group_size?: number
          program_start_date?: string | null
          suggestion_weeks?: number
          trial_block_days?: number
          trial_block_start_dow?: number
          updated_at?: string
          window_end_day?: number | null
          window_start_day?: number | null
        }
        Relationships: []
      }
      trial_slot_skips: {
        Row: {
          created_at: string
          created_by: string | null
          reason: string | null
          skip_date: string
          slot_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          reason?: string | null
          skip_date: string
          slot_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          reason?: string | null
          skip_date?: string
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_slot_skips_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "trial_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_slot_skips_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "v_trial_bookings_admin"
            referencedColumns: ["slot_id"]
          },
          {
            foreignKeyName: "trial_slot_skips_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "v_trial_slots_admin"
            referencedColumns: ["slot_id"]
          },
        ]
      }
      trial_slots: {
        Row: {
          archived_at: string | null
          capacity: number
          class_language: string | null
          created_at: string
          day_of_week: number
          duration_min: number
          enrollment_alert_sent_at: string | null
          id: string
          is_active: boolean
          lifecycle: string
          meeting_url: string | null
          min_run_checked_at: string | null
          min_to_run: number | null
          notes: string | null
          session_period: string | null
          start_time: string
          timezone: string
          trial_date: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          capacity?: number
          class_language?: string | null
          created_at?: string
          day_of_week: number
          duration_min?: number
          enrollment_alert_sent_at?: string | null
          id?: string
          is_active?: boolean
          lifecycle?: string
          meeting_url?: string | null
          min_run_checked_at?: string | null
          min_to_run?: number | null
          notes?: string | null
          session_period?: string | null
          start_time: string
          timezone?: string
          trial_date?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          capacity?: number
          class_language?: string | null
          created_at?: string
          day_of_week?: number
          duration_min?: number
          enrollment_alert_sent_at?: string | null
          id?: string
          is_active?: boolean
          lifecycle?: string
          meeting_url?: string | null
          min_run_checked_at?: string | null
          min_to_run?: number | null
          notes?: string | null
          session_period?: string | null
          start_time?: string
          timezone?: string
          trial_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_learning_goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          goal_name: string
          goal_type: string
          id: string
          status: string | null
          target_date: string | null
          target_value: number
          time_period: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          goal_name: string
          goal_type: string
          id?: string
          status?: string | null
          target_date?: string | null
          target_value: number
          time_period: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          goal_name?: string
          goal_type?: string
          id?: string
          status?: string | null
          target_date?: string | null
          target_value?: number
          time_period?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_learning_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_learning_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vocabulary_review_history: {
        Row: {
          created_at: string
          difficulty_factor: number
          id: number
          interval_days: number
          last_reviewed_at: string | null
          lesson_vocabulary_id: string
          next_review_date: string
          quality_last_review: number | null
          review_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty_factor?: number
          id?: number
          interval_days?: number
          last_reviewed_at?: string | null
          lesson_vocabulary_id: string
          next_review_date?: string
          quality_last_review?: number | null
          review_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty_factor?: number
          id?: number
          interval_days?: number
          last_reviewed_at?: string | null
          lesson_vocabulary_id?: string
          next_review_date?: string
          quality_last_review?: number | null
          review_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_review_history_lesson_vocabulary_id_fkey"
            columns: ["lesson_vocabulary_id"]
            isOneToOne: false
            referencedRelation: "lesson_vocabulary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_review_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocabulary_review_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_student_status_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocabulary_review_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      active_course_levels: {
        Row: {
          display_label: string | null
          key: string | null
          sort_order: number | null
        }
        Insert: {
          display_label?: string | null
          key?: string | null
          sort_order?: number | null
        }
        Update: {
          display_label?: string | null
          key?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      admin_student_overview: {
        Row: {
          amount: number | null
          amount_due: number | null
          approval_status: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          derived_status: string | null
          duration: number | null
          email: string | null
          enrollment_created_at: string | null
          enrollment_id: string | null
          joined_at: string | null
          level: string | null
          name: string | null
          negative_sessions: number | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string | null
          plan_type: string | null
          remaining_balance: number | null
          sessions_remaining: number | null
          sessions_total: number | null
          source_label: string | null
          unit_price: number | null
          user_id: string | null
        }
        Relationships: []
      }
      admin_student_status_overview: {
        Row: {
          active_enrollment_id: string | null
          amount: number | null
          approval_status: string | null
          classes_included: number | null
          computed_status: string | null
          country: string | null
          currency: string | null
          duration: number | null
          email: string | null
          enrollment_created_at: string | null
          enrollment_status: string | null
          level: string | null
          matched_at: string | null
          name: string | null
          package_id: string | null
          payment_status: string | null
          plan_type: string | null
          profile_created_at: string | null
          profile_level: string | null
          sessions_remaining: number | null
          sessions_total: number | null
          slot_id: string | null
          unit_price: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_level_fkey_course_levels"
            columns: ["profile_level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "profiles_level_fkey_course_levels"
            columns: ["profile_level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      checkout_recovery_kpi: {
        Row: {
          click_rate_pct: number | null
          leads_clicked: number | null
          leads_converted: number | null
          leads_emailed: number | null
          leads_opened: number | null
          open_rate_pct: number | null
          recovery_rate_pct: number | null
          total_sent: number | null
        }
        Relationships: []
      }
      checkout_recovery_tracker: {
        Row: {
          converted_at: string | null
          email: string | null
          emails_sent: number | null
          last_clicked_at: string | null
          last_opened_at: string | null
          last_sent_at: string | null
          last_stage_sent: number | null
          lead_created_at: string | null
          lead_id: string | null
          name: string | null
          plan_type: string | null
          unsubscribed: boolean | null
        }
        Relationships: []
      }
      lead_funnel: {
        Row: {
          booked_trial: boolean | null
          clicked_free_trial: boolean | null
          clicked_whatsapp: boolean | null
          enrolled_paid: boolean | null
          entry_page: string | null
          event_count: number | null
          first_referrer: string | null
          first_seen: string | null
          first_source: string | null
          first_utm_campaign: string | null
          first_utm_medium: string | null
          first_utm_source: string | null
          last_seen: string | null
          last_source: string | null
          session_id: string | null
          signup_completed: boolean | null
          started_placement: boolean | null
          touchpoints: string[] | null
          user_id: string | null
          viewed_pricing_cta: boolean | null
        }
        Relationships: []
      }
      v_trial_bookings_admin: {
        Row: {
          attendance_responded_at: string | null
          attendance_response: string | null
          class_language: string | null
          confirmed_at: string | null
          created_at: string | null
          day_name: string | null
          day_of_week: number | null
          email: string | null
          email_opened_at: string | null
          email_sent_at: string | null
          goal: string | null
          id: string | null
          is_tba: boolean | null
          level: string | null
          name: string | null
          next_trial_month: string | null
          phone: string | null
          program_phase: string | null
          rollover_notified_at: string | null
          rollover_status: string | null
          slot_capacity: number | null
          slot_duration_min: number | null
          slot_exists: boolean | null
          slot_id: string | null
          slot_is_active: boolean | null
          slot_lifecycle: string | null
          start_time: string | null
          status: string | null
          time_bucket: string | null
          timezone: string | null
          trial_date: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_bookings_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "active_course_levels"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "trial_bookings_level_fkey_course_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["key"]
          },
        ]
      }
      v_trial_slot_fill_rate: {
        Row: {
          booked_count: number | null
          capacity: number | null
          day_of_week: number | null
          fill_pct: number | null
          near_capacity: boolean | null
          next_trial_date: string | null
          start_time: string | null
        }
        Relationships: []
      }
      v_trial_slots_admin: {
        Row: {
          booked_count: number | null
          capacity: number | null
          class_language: string | null
          day_name: string | null
          day_of_week: number | null
          duration_min: number | null
          is_active: boolean | null
          is_full: boolean | null
          lifecycle: string | null
          meeting_url: string | null
          min_to_run: number | null
          occurrence_date: string | null
          seats_left: number | null
          session_period: string | null
          slot_id: string | null
          start_time: string | null
          timezone: string | null
        }
        Relationships: []
      }
      xp_leaderboard: {
        Row: {
          avatar_url: string | null
          name: string | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _trial_time_to_minutes: { Args: { t: string }; Returns: number }
      add_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: number
      }
      admin_add_attendance: {
        Args: {
          p_enrollment_id: string
          p_note?: string
          p_session_date: string
        }
        Returns: number
      }
      admin_manual_enroll: {
        Args: {
          p_amount: number
          p_classes_included: number
          p_currency: string
          p_duration: number
          p_group_id?: string
          p_level?: string
          p_plan_type: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_remove_attendance: {
        Args: { p_enrollment_id: string; p_session_date: string }
        Returns: number
      }
      advance_trial_slots: { Args: never; Returns: undefined }
      approve_attendance_request: {
        Args: { _request_id: string }
        Returns: number
      }
      approve_enrollment: {
        Args: {
          _admin_id: string
          _enrollment_id: string
          _unit_price?: number
        }
        Returns: undefined
      }
      approve_group_attendance: {
        Args: { _attendance_id: string }
        Returns: undefined
      }
      assign_student_to_group: {
        Args: { _enrollment_id?: string; _package_id: string; _user_id: string }
        Returns: Json
      }
      assign_student_to_group_from_slot: {
        Args: { _enrollment_id?: string; _slot_id: string; _user_id: string }
        Returns: Json
      }
      assign_student_to_pkg_group: {
        Args: { _enrollment_id: string; _user_id: string }
        Returns: string
      }
      attach_session_to_user: {
        Args: { p_session: string }
        Returns: undefined
      }
      auto_match_student: { Args: { _preference_id: string }; Returns: string }
      auto_send_profile_reminders: { Args: never; Returns: undefined }
      backfill_missing_enrollments: { Args: never; Returns: Json }
      book_trial_with_capacity_check: {
        Args: {
          p_day_of_week: number
          p_email: string
          p_goal: string
          p_level: string
          p_name: string
          p_phone: string
          p_start_time: string
          p_timezone: string
          p_trial_date: string
          p_user_id?: string
        }
        Returns: string
      }
      cancel_enrollment: {
        Args: { _enrollment_id: string }
        Returns: undefined
      }
      check_trial_cron_health: { Args: never; Returns: undefined }
      claim_trial_capacity_alert: {
        Args: { p_start_time: string; p_trial_date: string }
        Returns: {
          capacity: number
          class_language: string
          confirmed_count: number
          day_of_week: number
          fourth_email: string
          fourth_name: string
          should_send: boolean
          timezone: string
        }[]
      }
      claim_trial_min_run_check: {
        Args: { p_start_time: string; p_trial_date: string }
        Returns: {
          affected_bookings: number
          confirmed_count: number
          min_required: number
          should_rollover: boolean
        }[]
      }
      cleanup_pkg_groups: { Args: never; Returns: Json }
      complete_schedule_resubmission: {
        Args: {
          _level: string
          _package_id: string
          _preferred_day: string
          _preferred_time: string
          _timezone: string
          _token: string
        }
        Returns: undefined
      }
      create_egypt_order: {
        Args: { _duration: number; _plan_type: string }
        Returns: string
      }
      deduct_credit: { Args: { _user_id: string }; Returns: number }
      ensure_pkg_groups_for_packages: { Args: never; Returns: number }
      factory_reset_data: { Args: never; Returns: string }
      fn_create_trial_slot: {
        Args: {
          p_capacity?: number
          p_day_of_week: number
          p_duration_min?: number
          p_start_time: string
          p_timezone?: string
        }
        Returns: {
          archived_at: string | null
          capacity: number
          class_language: string | null
          created_at: string
          day_of_week: number
          duration_min: number
          enrollment_alert_sent_at: string | null
          id: string
          is_active: boolean
          lifecycle: string
          meeting_url: string | null
          min_run_checked_at: string | null
          min_to_run: number | null
          notes: string | null
          session_period: string | null
          start_time: string
          timezone: string
          trial_date: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trial_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_first_trial_block_date: { Args: { p_month: string }; Returns: string }
      fn_retire_trial_slot: {
        Args: { p_new_lifecycle?: string; p_slot_id: string }
        Returns: {
          archived_at: string | null
          capacity: number
          class_language: string | null
          created_at: string
          day_of_week: number
          duration_min: number
          enrollment_alert_sent_at: string | null
          id: string
          is_active: boolean
          lifecycle: string
          meeting_url: string | null
          min_run_checked_at: string | null
          min_to_run: number | null
          notes: string | null
          session_period: string | null
          start_time: string
          timezone: string
          trial_date: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trial_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_set_trial_program_start_date: {
        Args: { p_date: string }
        Returns: {
          default_duration_min: number
          id: number
          min_group_size: number
          program_start_date: string | null
          suggestion_weeks: number
          trial_block_days: number
          trial_block_start_dow: number
          updated_at: string
          window_end_day: number | null
          window_start_day: number | null
        }
        SetofOptions: {
          from: "*"
          to: "trial_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_suggest_trial_slots: {
        Args: never
        Returns: {
          day_name: string
          day_of_week: number
          duration_min: number
          has_historical_demand: boolean
          is_reasonable_hour: boolean
          reasons: string[]
          score: number
          source: string
          start_time: string
          timezone: string
          would_replace_full_slot: boolean
        }[]
      }
      fn_trial_slot_conflicts: {
        Args: {
          p_day_of_week: number
          p_duration_min?: number
          p_start_text: string
        }
        Returns: {
          detail: string
          source: string
        }[]
      }
      fn_update_trial_slot: {
        Args: {
          p_capacity?: number
          p_class_language?: string
          p_clear_meeting_url?: boolean
          p_clear_min_to_run?: boolean
          p_duration_min?: number
          p_lifecycle?: string
          p_meeting_url?: string
          p_min_to_run?: number
          p_session_period?: string
          p_slot_id: string
          p_start_time?: string
          p_timezone?: string
          p_trial_date?: string
        }
        Returns: {
          archived_at: string | null
          capacity: number
          class_language: string | null
          created_at: string
          day_of_week: number
          duration_min: number
          enrollment_alert_sent_at: string | null
          id: string
          is_active: boolean
          lifecycle: string
          meeting_url: string | null
          min_run_checked_at: string | null
          min_to_run: number | null
          notes: string | null
          session_period: string | null
          start_time: string
          timezone: string
          trial_date: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trial_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_group_sessions: {
        Args: { p_group_id: string; p_start_date?: string; p_weeks?: number }
        Returns: {
          created: boolean
          session_date: string
        }[]
      }
      generate_sessions_for_group: {
        Args: { p_group_id: string; p_start_date?: string; p_weeks?: number }
        Returns: number
      }
      get_auth_email: { Args: never; Returns: string }
      get_enrollment_for_payment: {
        Args: { p_enrollment_id: string }
        Returns: {
          amount: number
          approval_status: string
          classes_included: number
          currency: string
          due_at: string
          duration: number
          id: string
          payment_date: string
          payment_method: string
          plan_type: string
          receipt_url: string
          user_id: string
        }[]
      }
      get_group_sessions: {
        Args: { p_from?: string; p_group_id: string; p_to?: string }
        Returns: {
          marked_count: number
          present_count: number
          session_date: string
          session_id: string
          total_members: number
        }[]
      }
      get_near_capacity_trial_slots: {
        Args: never
        Returns: {
          booked_count: number
          capacity: number
          day_of_week: number
          fill_pct: number
          next_trial_date: string
          start_time: string
        }[]
      }
      get_session_roster: {
        Args: { p_session_id: string }
        Returns: {
          admin_approved: boolean
          attendance_status: string
          email: string
          full_name: string
          user_id: string
        }[]
      }
      get_sessions_for_reminder_1h: {
        Args: never
        Returns: {
          duration_min: number
          email: string
          group_name: string
          level: string
          name: string
          session_date: string
          session_id: string
          start_time: string
          user_id: string
        }[]
      }
      get_sessions_for_reminder_24h: {
        Args: never
        Returns: {
          duration_min: number
          email: string
          group_name: string
          level: string
          name: string
          session_date: string
          session_id: string
          start_time: string
          user_id: string
        }[]
      }
      get_student_preference_trends: {
        Args: { days_back?: number }
        Returns: {
          day_of_week: number
          level: string
          preferred_start_time: string
          request_count: number
        }[]
      }
      get_student_upcoming_sessions: {
        Args: { p_user_id: string }
        Returns: {
          attendance_status: string
          day_of_week: number
          duration_min: number
          group_id: string
          group_name: string
          level: string
          session_date: string
          session_id: string
          start_time: string
          timezone: string
        }[]
      }
      get_trial_availability: {
        Args: { p_language?: string }
        Returns: {
          booked_count: number
          capacity: number
          class_language: string
          day_of_week: number
          duration_min: number
          next_trial_date: string
          session_period: string
          start_time: string
          timezone: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_blog_view: { Args: { post_slug: string }; Returns: undefined }
      log_pgnet_email_failures: { Args: never; Returns: undefined }
      mark_student_attendance: {
        Args: { _notes?: string; _student_id: string }
        Returns: number
      }
      match_enrollment_to_slot: {
        Args: { _enrollment_id: string }
        Returns: string
      }
      normalize_level: { Args: { raw: string }; Returns: string }
      reassign_student_slot: {
        Args: { _enrollment_id: string; _new_slot_id: string }
        Returns: undefined
      }
      reject_attendance_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      reset_platform_data: {
        Args: { _reset_password: string }
        Returns: string
      }
      resolve_user_language: {
        Args: { p_country?: string; p_email: string }
        Returns: string
      }
      revert_attendance_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      revert_enrollment: {
        Args: { _enrollment_id: string }
        Returns: undefined
      }
      run_trial_min_group_checks: { Args: never; Returns: undefined }
      save_session_attendance: {
        Args: { p_records: Json; p_session_id: string }
        Returns: number
      }
      save_student_preference: {
        Args: {
          p_level?: string
          p_preferred_day_of_week: number
          p_preferred_start_time: string
          p_user_id: string
        }
        Returns: boolean
      }
      send_class_feedback_emails: { Args: never; Returns: undefined }
      send_forming_escalation_emails: { Args: never; Returns: undefined }
      send_forming_group_emails: { Args: never; Returns: undefined }
      send_pre_class_reminders: { Args: never; Returns: undefined }
      send_receipt_nudge_emails: { Args: never; Returns: undefined }
      send_rejection_followup_emails: { Args: never; Returns: undefined }
      submit_egypt_payment: {
        Args: {
          _enrollment_id: string
          _payment_date: string
          _payment_method: string
          _receipt_url: string
          _tx_ref?: string
        }
        Returns: undefined
      }
      submit_enrollment_with_preference: {
        Args: {
          p_amount: number
          p_classes_included: number
          p_duration: number
          p_level: string
          p_payment_provider: string
          p_plan_type: string
          p_preferred_day_of_week?: number
          p_preferred_start_time?: string
          p_stripe_payment_intent_id?: string
          p_unit_price: number
          p_user_id: string
        }
        Returns: Json
      }
      submit_manual_enrollment:
        | {
            Args: {
              _amount: number
              _duration: number
              _plan_type: string
              _receipt_url: string
              _tx_ref: string
            }
            Returns: string
          }
        | {
            Args: {
              _amount: number
              _duration: number
              _payment_method?: string
              _plan_type: string
              _receipt_url: string
              _tx_ref: string
            }
            Returns: string
          }
      trigger_abandoned_checkout_recovery: { Args: never; Returns: undefined }
      trigger_class_reminder_1h: { Args: never; Returns: undefined }
      trigger_class_reminder_24h: { Args: never; Returns: undefined }
      trigger_funnel_digest: { Args: never; Returns: undefined }
      trigger_trial_followups: { Args: never; Returns: undefined }
      unmatch_student_slot: {
        Args: { _enrollment_id: string }
        Returns: undefined
      }
      update_student_preferences: {
        Args: {
          _enrollment_id: string
          _preferred_days: string[]
          _timezone: string
        }
        Returns: undefined
      }
      upsert_trial_booking: {
        Args: {
          p_day_of_week: number
          p_delete_id: string
          p_email: string
          p_goal: string
          p_language: string
          p_level: string
          p_name: string
          p_phone: string
          p_start_time: string
          p_status: string
          p_timezone: string
          p_trial_date: string
          p_user_id: string
        }
        Returns: string
      }
      upsert_trial_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_max_attempts?: number
          p_window_start: string
        }
        Returns: boolean
      }
      validate_resubmission_token: {
        Args: { _token: string }
        Returns: {
          email: string
          enrollment_id: string
          expires_at: string
          id: string
          status: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
