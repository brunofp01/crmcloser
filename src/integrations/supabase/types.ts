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
      ai_conversations: {
        Row: {
          ai_enabled: boolean
          client_id: string | null
          created_at: string
          extracted_interests: Json | null
          id: string
          lead_qualified: boolean | null
          messages: Json | null
          phone: string | null
          platform: string | null
          qualification_score: number | null
          session_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          client_id?: string | null
          created_at?: string
          extracted_interests?: Json | null
          id?: string
          lead_qualified?: boolean | null
          messages?: Json | null
          phone?: string | null
          platform?: string | null
          qualification_score?: number | null
          session_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          client_id?: string | null
          created_at?: string
          extracted_interests?: Json | null
          id?: string
          lead_qualified?: boolean | null
          messages?: Json | null
          phone?: string | null
          platform?: string | null
          qualification_score?: number | null
          session_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          start_time: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          start_time: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          start_time?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      aprendizados_ia: {
        Row: {
          aprovado_por: string | null
          contexto: Json | null
          created_at: string
          frequencia: number | null
          id: string
          pergunta: string | null
          resposta: string | null
          status: string | null
          tipo: string
          ultima_ocorrencia: string | null
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          contexto?: Json | null
          created_at?: string
          frequencia?: number | null
          id?: string
          pergunta?: string | null
          resposta?: string | null
          status?: string | null
          tipo: string
          ultima_ocorrencia?: string | null
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          contexto?: Json | null
          created_at?: string
          frequencia?: number | null
          id?: string
          pergunta?: string | null
          resposta?: string | null
          status?: string | null
          tipo?: string
          ultima_ocorrencia?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_interactions: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          area_min: number | null
          assigned_to: string | null
          bedrooms_min: number | null
          budget: string | null
          budget_max: number | null
          budget_min: number | null
          cidades: string[] | null
          created_at: string
          created_by: string
          elevator_preference: string | null
          email: string | null
          finalidade: string | null
          forma_pagamento: string[] | null
          id: string
          is_investidor: boolean
          leisure_features: string[] | null
          name: string
          needs_leisure: boolean | null
          notes: string | null
          parking_min: number | null
          phone: string
          portaria_preferencia: string[] | null
          preferred_region: string | null
          priority: Database["public"]["Enums"]["client_priority"]
          property_type: string | null
          property_types: string[] | null
          region_flexible: boolean
          source: string | null
          stage: Database["public"]["Enums"]["client_stage"]
          transaction_type: string | null
          updated_at: string
          urgencia: string | null
        }
        Insert: {
          area_min?: number | null
          assigned_to?: string | null
          bedrooms_min?: number | null
          budget?: string | null
          budget_max?: number | null
          budget_min?: number | null
          cidades?: string[] | null
          created_at?: string
          created_by: string
          elevator_preference?: string | null
          email?: string | null
          finalidade?: string | null
          forma_pagamento?: string[] | null
          id?: string
          is_investidor?: boolean
          leisure_features?: string[] | null
          name: string
          needs_leisure?: boolean | null
          notes?: string | null
          parking_min?: number | null
          phone: string
          portaria_preferencia?: string[] | null
          preferred_region?: string | null
          priority?: Database["public"]["Enums"]["client_priority"]
          property_type?: string | null
          property_types?: string[] | null
          region_flexible?: boolean
          source?: string | null
          stage?: Database["public"]["Enums"]["client_stage"]
          transaction_type?: string | null
          updated_at?: string
          urgencia?: string | null
        }
        Update: {
          area_min?: number | null
          assigned_to?: string | null
          bedrooms_min?: number | null
          budget?: string | null
          budget_max?: number | null
          budget_min?: number | null
          cidades?: string[] | null
          created_at?: string
          created_by?: string
          elevator_preference?: string | null
          email?: string | null
          finalidade?: string | null
          forma_pagamento?: string[] | null
          id?: string
          is_investidor?: boolean
          leisure_features?: string[] | null
          name?: string
          needs_leisure?: boolean | null
          notes?: string | null
          parking_min?: number | null
          phone?: string
          portaria_preferencia?: string[] | null
          preferred_region?: string | null
          priority?: Database["public"]["Enums"]["client_priority"]
          property_type?: string | null
          property_types?: string[] | null
          region_flexible?: boolean
          source?: string | null
          stage?: Database["public"]["Enums"]["client_stage"]
          transaction_type?: string | null
          updated_at?: string
          urgencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      deal_clients: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          deal_id: string
          id: string
          stage: Database["public"]["Enums"]["deal_client_stage"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          deal_id: string
          id?: string
          stage?: Database["public"]["Enums"]["deal_client_stage"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          deal_id?: string
          id?: string
          stage?: Database["public"]["Enums"]["deal_client_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_clients_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_interactions: {
        Row: {
          created_at: string
          created_by: string
          deal_id: string
          description: string | null
          id: string
          metadata: Json | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_id: string
          description?: string | null
          id?: string
          metadata?: Json | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_id?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_interactions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_partners: {
        Row: {
          created_at: string
          deal_id: string
          email: string | null
          id: string
          nome: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          email?: string | null
          id?: string
          nome: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          email?: string | null
          id?: string
          nome?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_partners_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_proposals: {
        Row: {
          client_id: string
          composicao: Json | null
          created_at: string
          created_by: string
          deal_id: string
          id: string
          status: string
          updated_at: string
          valor_proposta: number
        }
        Insert: {
          client_id: string
          composicao?: Json | null
          created_at?: string
          created_by: string
          deal_id: string
          id?: string
          status?: string
          updated_at?: string
          valor_proposta: number
        }
        Update: {
          client_id?: string
          composicao?: Json | null
          created_at?: string
          created_by?: string
          deal_id?: string
          id?: string
          status?: string
          updated_at?: string
          valor_proposta?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          area_lazer: Json | null
          bairro: string | null
          banheiros: number | null
          bloco: string | null
          cidade: string | null
          codigo_imovel: string | null
          comissao_percentual: number | null
          cozinhas: number | null
          created_at: string
          created_by: string
          elevador_servico: boolean | null
          elevador_social: boolean | null
          endereco: string | null
          estado: string | null
          id: string
          listing_description: string | null
          listing_image_url: string | null
          listing_url: string | null
          metragem: number | null
          numero_apartamento: string | null
          numero_predio: string | null
          portaria: string | null
          proprietario_email: string | null
          proprietario_nome: string | null
          proprietario_quer_comprar: boolean
          proprietario_whatsapp: string | null
          quartos: number | null
          salas: number | null
          status: string
          suites: number | null
          tem_parceria: boolean | null
          tipo: string | null
          title: string | null
          updated_at: string
          vagas: number | null
          valor: number | null
        }
        Insert: {
          area_lazer?: Json | null
          bairro?: string | null
          banheiros?: number | null
          bloco?: string | null
          cidade?: string | null
          codigo_imovel?: string | null
          comissao_percentual?: number | null
          cozinhas?: number | null
          created_at?: string
          created_by: string
          elevador_servico?: boolean | null
          elevador_social?: boolean | null
          endereco?: string | null
          estado?: string | null
          id?: string
          listing_description?: string | null
          listing_image_url?: string | null
          listing_url?: string | null
          metragem?: number | null
          numero_apartamento?: string | null
          numero_predio?: string | null
          portaria?: string | null
          proprietario_email?: string | null
          proprietario_nome?: string | null
          proprietario_quer_comprar?: boolean
          proprietario_whatsapp?: string | null
          quartos?: number | null
          salas?: number | null
          status?: string
          suites?: number | null
          tem_parceria?: boolean | null
          tipo?: string | null
          title?: string | null
          updated_at?: string
          vagas?: number | null
          valor?: number | null
        }
        Update: {
          area_lazer?: Json | null
          bairro?: string | null
          banheiros?: number | null
          bloco?: string | null
          cidade?: string | null
          codigo_imovel?: string | null
          comissao_percentual?: number | null
          cozinhas?: number | null
          created_at?: string
          created_by?: string
          elevador_servico?: boolean | null
          elevador_social?: boolean | null
          endereco?: string | null
          estado?: string | null
          id?: string
          listing_description?: string | null
          listing_image_url?: string | null
          listing_url?: string | null
          metragem?: number | null
          numero_apartamento?: string | null
          numero_predio?: string | null
          portaria?: string | null
          proprietario_email?: string | null
          proprietario_nome?: string | null
          proprietario_quer_comprar?: boolean
          proprietario_whatsapp?: string | null
          quartos?: number | null
          salas?: number | null
          status?: string
          suites?: number | null
          tem_parceria?: boolean | null
          tipo?: string | null
          title?: string | null
          updated_at?: string
          vagas?: number | null
          valor?: number | null
        }
        Relationships: []
      }
      dismissed_matches: {
        Row: {
          client_id: string
          created_at: string
          deal_id: string
          dismissed_by: string
          id: string
          reason: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          deal_id: string
          dismissed_by: string
          id?: string
          reason?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          deal_id?: string
          dismissed_by?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissed_matches_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      imoveis: {
        Row: {
          area_total: number | null
          area_util: number | null
          ativo: boolean | null
          bairro: string | null
          banheiros: number | null
          caracteristicas: Json | null
          categoria: string | null
          cep: string | null
          cidade: string | null
          codigo: string
          created_at: string
          descricao: string | null
          destaque: boolean | null
          endereco: string | null
          estado: string | null
          fotos: Json | null
          hotsite_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          quartos: number | null
          slug: string
          source: string | null
          suites: number | null
          synced_at: string | null
          tipo: string | null
          titulo: string | null
          updated_at: string
          vagas: number | null
          valor: number | null
          xml_data: Json | null
        }
        Insert: {
          area_total?: number | null
          area_util?: number | null
          ativo?: boolean | null
          bairro?: string | null
          banheiros?: number | null
          caracteristicas?: Json | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          codigo: string
          created_at?: string
          descricao?: string | null
          destaque?: boolean | null
          endereco?: string | null
          estado?: string | null
          fotos?: Json | null
          hotsite_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          quartos?: number | null
          slug: string
          source?: string | null
          suites?: number | null
          synced_at?: string | null
          tipo?: string | null
          titulo?: string | null
          updated_at?: string
          vagas?: number | null
          valor?: number | null
          xml_data?: Json | null
        }
        Update: {
          area_total?: number | null
          area_util?: number | null
          ativo?: boolean | null
          bairro?: string | null
          banheiros?: number | null
          caracteristicas?: Json | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          codigo?: string
          created_at?: string
          descricao?: string | null
          destaque?: boolean | null
          endereco?: string | null
          estado?: string | null
          fotos?: Json | null
          hotsite_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          quartos?: number | null
          slug?: string
          source?: string | null
          suites?: number | null
          synced_at?: string | null
          tipo?: string | null
          titulo?: string | null
          updated_at?: string
          vagas?: number | null
          valor?: number | null
          xml_data?: Json | null
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          andares: number | null
          area_lazer: Json | null
          area_max: number | null
          area_min: number | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          comissao_percentual: number | null
          construtora: string | null
          created_at: string
          created_by: string
          descricao: string | null
          diferenciais: Json | null
          endereco: string | null
          estado: string | null
          forma_pagamento: string[] | null
          fotos: Json | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          nome: string
          numero: string | null
          observacoes: string | null
          plantas: Json | null
          previsao_entrega: string | null
          quartos_max: number | null
          quartos_min: number | null
          status: string
          suites_max: number | null
          suites_min: number | null
          tipo: string | null
          total_unidades: number | null
          unidades_por_andar: number | null
          updated_at: string
          vagas_max: number | null
          vagas_min: number | null
          valor_max: number | null
          valor_min: number | null
          video_url: string | null
          website_url: string | null
        }
        Insert: {
          andares?: number | null
          area_lazer?: Json | null
          area_max?: number | null
          area_min?: number | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          comissao_percentual?: number | null
          construtora?: string | null
          created_at?: string
          created_by: string
          descricao?: string | null
          diferenciais?: Json | null
          endereco?: string | null
          estado?: string | null
          forma_pagamento?: string[] | null
          fotos?: Json | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          plantas?: Json | null
          previsao_entrega?: string | null
          quartos_max?: number | null
          quartos_min?: number | null
          status?: string
          suites_max?: number | null
          suites_min?: number | null
          tipo?: string | null
          total_unidades?: number | null
          unidades_por_andar?: number | null
          updated_at?: string
          vagas_max?: number | null
          vagas_min?: number | null
          valor_max?: number | null
          valor_min?: number | null
          video_url?: string | null
          website_url?: string | null
        }
        Update: {
          andares?: number | null
          area_lazer?: Json | null
          area_max?: number | null
          area_min?: number | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          comissao_percentual?: number | null
          construtora?: string | null
          created_at?: string
          created_by?: string
          descricao?: string | null
          diferenciais?: Json | null
          endereco?: string | null
          estado?: string | null
          forma_pagamento?: string[] | null
          fotos?: Json | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          plantas?: Json | null
          previsao_entrega?: string | null
          quartos_max?: number | null
          quartos_min?: number | null
          status?: string
          suites_max?: number | null
          suites_min?: number | null
          tipo?: string | null
          total_unidades?: number | null
          unidades_por_andar?: number | null
          updated_at?: string
          vagas_max?: number | null
          vagas_min?: number | null
          valor_max?: number | null
          valor_min?: number | null
          video_url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          manager_id: string | null
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          manager_id?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          manager_id?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      property_sources: {
        Row: {
          base_url: string | null
          created_at: string
          description: string | null
          hotsite_base_url: string | null
          id: string
          last_sync_at: string | null
          name: string
          sync_enabled: boolean | null
          sync_interval_hours: number | null
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          description?: string | null
          hotsite_base_url?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          sync_enabled?: boolean | null
          sync_interval_hours?: number | null
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          description?: string | null
          hotsite_base_url?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          sync_enabled?: boolean | null
          sync_interval_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          deactivated: number | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          errors_count: number | null
          feed_hash: string | null
          id: string
          inserted: number | null
          started_at: string
          status: string
          sync_type: string
          total_items: number | null
          updated: number | null
          xml_size: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deactivated?: number | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          errors_count?: number | null
          feed_hash?: string | null
          id?: string
          inserted?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          total_items?: number | null
          updated?: number | null
          xml_size?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deactivated?: number | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          errors_count?: number | null
          feed_hash?: string | null
          id?: string
          inserted?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          total_items?: number | null
          updated?: number | null
          xml_size?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          description: string | null
          due_date: string
          id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          description?: string | null
          due_date: string
          id?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string
          id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_user: {
        Args: { _target_user_id: string; _viewer_id: string }
        Returns: boolean
      }
      get_visible_user_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_master_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "master" | "user" | "gerente" | "corretor"
      client_priority: "low" | "medium" | "high"
      client_stage:
        | "lead"
        | "qualification"
        | "contact"
        | "visit"
        | "proposal"
        | "negotiation"
        | "closed"
        | "quarantine"
        | "lost"
      deal_client_stage:
        | "enviado"
        | "agendar_visita"
        | "visita_agendada"
        | "visitou"
        | "em_negociacao"
        | "vendido"
        | "nao_interessa"
        | "preco_alto"
        | "fora_do_perfil"
      interaction_type:
        | "call"
        | "email"
        | "whatsapp"
        | "visit"
        | "meeting"
        | "stage_change"
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
      app_role: ["master", "user", "gerente", "corretor"],
      client_priority: ["low", "medium", "high"],
      client_stage: [
        "lead",
        "qualification",
        "contact",
        "visit",
        "proposal",
        "negotiation",
        "closed",
        "quarantine",
        "lost",
      ],
      deal_client_stage: [
        "enviado",
        "agendar_visita",
        "visita_agendada",
        "visitou",
        "em_negociacao",
        "vendido",
        "nao_interessa",
        "preco_alto",
        "fora_do_perfil",
      ],
      interaction_type: [
        "call",
        "email",
        "whatsapp",
        "visit",
        "meeting",
        "stage_change",
      ],
    },
  },
} as const
