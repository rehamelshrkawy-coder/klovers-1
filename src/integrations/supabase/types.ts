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
          available_from?: string
          book_id: string
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
          seo_score: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          article_type?: string
          author?: string
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string
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
          seo_score?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          article_type?: string
          author?: string
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string
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
          seo_score?: number | null
          slug?: string
          title?: string
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
        Relationships: []
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
          approval_status: string
          classes_included: number
          class_link_sent_at: string | null
          class_type: string | null
          created_at: string
          currency: string
          due_at: string | null
          duration: number
          enrollment_status: string
          first_class_date: string | null
          id: string
          last_reminder_at: string | null
          level: string | null
          matched_at: string | null
          matched_batch_id: string | null
          negative_since: string | null
          notes: string | null
          package_id: string | null
          payment_date: string | null
          payment_email_sent_at: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string
          plan_type: string
          preferred_day: string | null
          preferred_days: string[] | null
          preferred_start: string | null
          preferred_time: string | null
          receipt_url: string
          reminder_count: number
          reviewed_at: string | null
          reviewed_by: string | null
          sessions_remaining: number
          sessions_total: number
          slot_id: string | null
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
          approval_status?: string
          classes_included: number
          class_link_sent_at?: string | null
          class_type?: string | null
          created_at?: string
          currency?: string
          due_at?: string | null
          duration: number
          enrollment_status?: string
          first_class_date?: string | null
          id?: string
          last_reminder_at?: string | null
          level?: string | null
          matched_at?: string | null
          matched_batch_id?: string | null
          negative_since?: string | null
          notes?: string | null
          package_id?: string | null
          payment_date?: string | null
          payment_email_sent_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          plan_type: string
          preferred_day?: string | null
          preferred_days?: string[] | null
          preferred_start?: string | null
          preferred_time?: string | null
          receipt_url: string
          reminder_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_remaining?: number
          sessions_total?: number
          slot_id?: string | null
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
          approval_status?: string
          classes_included?: number
          class_link_sent_at?: string | null
          class_type?: string | null
          created_at?: string
          currency?: string
          due_at?: string | null
          duration?: number
          enrollment_status?: string
          first_class_date?: string | null
          id?: string
          last_reminder_at?: string | null
          level?: string | null
          matched_at?: string | null
          matched_batch_id?: string | null
          negative_since?: string | null
          notes?: string | null
          package_id?: string | null
          payment_date?: string | null
          payment_email_sent_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string
          plan_type?: string
          preferred_day?: string | null
          preferred_days?: string[] | null
          preferred_start?: string | null
          preferred_time?: string | null
          receipt_url?: string
          reminder_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_remaining?: number
          sessions_total?: number
          slot_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          timezone?: string | null
          tx_ref?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: [
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
          korean: string
          lesson_id: number
          meaning: string
          romanization: string
          sort_order: number
        }
        Insert: {
          id?: string
          korean: string
          lesson_id: number
          meaning: string
          romanization?: string
          sort_order?: number
        }
        Update: {
          id?: string
          korean?: string
          lesson_id?: number
          meaning?: string
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
          caption_text: string
          created_at: string
          description: string
          group_id: string | null
          headline: string
          id: string
          image_url_1x1: string | null
          image_url_4x5: string | null
          image_url_story: string | null
          status: string
          video_url: string | null
        }
        Insert: {
          ad_primary_text?: string
          caption_text?: string
          created_at?: string
          description?: string
          group_id?: string | null
          headline?: string
          id?: string
          image_url_1x1?: string | null
          image_url_4x5?: string | null
          image_url_story?: string | null
          status?: string
          video_url?: string | null
        }
        Update: {
          ad_primary_text?: string
          caption_text?: string
          created_at?: string
          description?: string
          group_id?: string | null
          headline?: string
          id?: string
          image_url_1x1?: string | null
          image_url_4x5?: string | null
          image_url_story?: string | null
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
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          course_level_key: string | null
          country: string
          created_at: string
          credits: number
          email: string
          id: string
          level: string
          language: string | null
          name: string
          reset_version: string | null
          status: string
          timezone: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          course_level_key?: string | null
          country?: string
          created_at?: string
          credits?: number
          email: string
          id?: string
          level?: string
          language?: string | null
          name: string
          reset_version?: string | null
          status?: string
          timezone?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          course_level_key?: string | null
          country?: string
          created_at?: string
          credits?: number
          email?: string
          id?: string
          level?: string
          language?: string | null
          name?: string
          reset_version?: string | null
          status?: string
          timezone?: string | null
          user_id?: string
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
        Relationships: []
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
        Relationships: []
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
      student_package_preferences: {
        Row: {
          level: string
          package_id: string | null
          requested_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          level?: string
          package_id?: string | null
          requested_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          level?: string
          package_id?: string | null
          requested_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
      achievement_milestones: {
        Row: {
          id: number
          user_id: string
          milestone_type: string
          milestone_tier: number
          milestone_name: string
          target_value: number
          progress_value: number
          is_achieved: boolean
          achieved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          milestone_type: string
          milestone_tier: number
          milestone_name: string
          target_value: number
          progress_value?: number
          is_achieved?: boolean
          achieved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          milestone_type?: string
          milestone_tier?: number
          milestone_name?: string
          target_value?: number
          progress_value?: number
          is_achieved?: boolean
          achieved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_learning_goals: {
        Row: {
          id: string
          user_id: string
          goal_type: string
          goal_name: string
          target_value: number
          time_period: string
          current_progress: number
          status: string
          created_at: string
          target_date: string | null
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: string
          goal_name: string
          target_value: number
          time_period: string
          current_progress?: number
          status?: string
          created_at?: string
          target_date?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: string
          goal_name?: string
          target_value?: number
          time_period?: string
          current_progress?: number
          status?: string
          created_at?: string
          target_date?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Relationships: []
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
        }
        Relationships: []
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
      training_starred: {
        Row: {
          id: string
          user_id: string
          starred: number[]
          collections: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          starred?: number[]
          collections?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          starred?: number[]
          collections?: Json
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          complained_at: string | null
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
      teacher_availability: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          is_available: boolean
          start_time: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          is_available?: boolean
          start_time: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          is_available?: boolean
          start_time?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
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
      trial_bookings: {
        Row: {
          attendance_confirmed_at: string | null
          attendance_responded_at: string | null
          attendance_response: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          changed_at: string | null
          class_language: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string
          day_of_week: number | null
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
          phone: string | null
          rebook_email_sent_at: string | null
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
          cancel_reason?: string | null
          cancelled_at?: string | null
          changed_at?: string | null
          class_language?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          day_of_week?: number | null
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
          phone?: string | null
          rebook_email_sent_at?: string | null
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
          cancel_reason?: string | null
          cancelled_at?: string | null
          changed_at?: string | null
          class_language?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          day_of_week?: number | null
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
          phone?: string | null
          rebook_email_sent_at?: string | null
          start_time?: string | null
          status?: string | null
          timezone?: string | null
          trial_date?: string | null
          user_id?: string | null
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
          campaign: string
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
      trial_settings: {
        Row: {
          default_duration_min: number
          id: number
          program_start_date: string | null
          suggestion_weeks: number
          updated_at: string
        }
        Insert: {
          default_duration_min?: number
          id?: number
          program_start_date?: string | null
          suggestion_weeks?: number
          updated_at?: string
        }
        Update: {
          default_duration_min?: number
          id?: number
          program_start_date?: string | null
          suggestion_weeks?: number
          updated_at?: string
        }
        Relationships: []
      }
      trial_slots: {
        Row: {
          archived_at: string | null
          capacity: number
          class_language: string | null
          created_at: string
          day_of_week: number
          duration_min: number
          id: string
          is_active: boolean
          lifecycle: string | null
          meeting_url: string | null
          notes: string | null
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
          id?: string
          is_active?: boolean
          lifecycle?: string | null
          meeting_url?: string | null
          notes?: string | null
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
          id?: string
          is_active?: boolean
          lifecycle?: string | null
          meeting_url?: string | null
          notes?: string | null
          start_time?: string
          timezone?: string
          trial_date?: string | null
          updated_at?: string
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
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      lead_funnel: {
        Row: {
          clicked_free_trial: boolean | null
          clicked_whatsapp: boolean | null
          first_seen: string | null
          last_seen: string | null
          received_broadcast: boolean | null
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
          cancel_reason: string | null
          cancelled_at: string | null
          changed_at: string | null
          class_language: string | null
          confirmation_email_failed_at: string | null
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
          phone: string | null
          program_phase: string | null
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
          is_full: boolean | null
          lifecycle: string | null
          meeting_url: string | null
          occurrence_date: string | null
          seats_left: number | null
          slot_id: string | null
          start_time: string | null
          timezone: string | null
        }
        Relationships: []
      }
      admin_student_overview: {
        Row: {
          amount: number | null
          amount_due: number | null
          approval_status: string | null
          country: string | null
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
      approve_enrollment: {
        Args: {
          _admin_id: string
          _enrollment_id: string
          _unit_price?: number | null
        }
        Returns: undefined
      }
      attach_session_to_user: {
        Args: { p_session: string }
        Returns: undefined
      }
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
      admin_remove_attendance: {
        Args: { p_enrollment_id: string; p_session_date: string }
        Returns: number
      }
      approve_attendance_request: {
        Args: { _request_id: string }
        Returns: number
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
      auto_match_student: { Args: { _preference_id: string }; Returns: string }
      backfill_missing_enrollments: { Args: never; Returns: Json }
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
          p_capacity?: number | null
          p_day_of_week: number
          p_duration_min?: number | null
          p_start_time: string
          p_timezone?: string | null
        }
        Returns: Database["public"]["Tables"]["trial_slots"]["Row"]
      }
      fn_retire_trial_slot: {
        Args: { p_new_lifecycle?: string; p_slot_id: string }
        Returns: Database["public"]["Tables"]["trial_slots"]["Row"]
      }
      fn_set_trial_program_start_date: {
        Args: { p_date: string | null }
        Returns: Database["public"]["Tables"]["trial_settings"]["Row"]
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
      get_auth_email: { Args: never; Returns: string }
      get_student_preference_trends: {
        Args: { days_back?: number }
        Returns: {
          day_of_week: number
          level: string
          preferred_start_time: string
          request_count: number
        }[]
      }
      get_trial_availability: {
        Args: { p_language?: string | null }
        Returns: {
          booked_count: number
          capacity: number
          class_language: string | null
          day_of_week: number
          duration_min: number
          next_trial_date: string
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
      mark_student_attendance: {
        Args: { _notes?: string; _student_id: string }
        Returns: number
      }
      match_enrollment_to_slot: {
        Args: { _enrollment_id: string }
        Returns: string
      }
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
      revert_attendance_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      revert_enrollment: {
        Args: { _enrollment_id: string }
        Returns: undefined
      }
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
