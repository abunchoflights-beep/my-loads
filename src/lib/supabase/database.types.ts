
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_role": string,"created_at": string,"id": number,"new_row": Json | null,"old_row": Json | null,"record_id": string,"table_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_role": string,"created_at"?: string,"id"?: never,"new_row"?: Json | null,"old_row"?: Json | null,"record_id": string,"table_name": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_role"?: string,"created_at"?: string,"id"?: never,"new_row"?: Json | null,"old_row"?: Json | null,"record_id"?: string,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"delivery_locations": {
                  Row: {
                    "address": string,"created_at": string,"id": string,"label": string,"lat": number | null,"lng": number | null,"municipality_code": string,"owner_id": string,"receiving_hours": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"created_at"?: string,"id"?: string,"label": string,"lat"?: number | null,"lng"?: number | null,"municipality_code": string,"owner_id": string,"receiving_hours"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string,"created_at"?: string,"id"?: string,"label"?: string,"lat"?: number | null,"lng"?: number | null,"municipality_code"?: string,"owner_id"?: string,"receiving_hours"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "delivery_locations_municipality_fk"
      columns: ["municipality_code"]
isOneToOne: false
      referencedRelation: "municipalities"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "delivery_locations_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"farms": {
                  Row: {
                    "created_at": string,"directions": string | null,"id": string,"lat": number | null,"lng": number | null,"municipality_code": string,"name": string,"owner_id": string,"updated_at": string,"vereda": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"directions"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"municipality_code": string,"name": string,"owner_id": string,"updated_at"?: string,"vereda"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"directions"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"municipality_code"?: string,"name"?: string,"owner_id"?: string,"updated_at"?: string,"vereda"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "farms_municipality_fk"
      columns: ["municipality_code"]
isOneToOne: false
      referencedRelation: "municipalities"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "farms_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"listings": {
                  Row: {
                    "available_from": string,"available_kg": number,"available_until": string,"created_at": string,"description": string | null,"farm_id": string,"farmer_id": string,"harvest_on": string | null,"id": string,"min_order_kg": number,"municipality_code": string,"photo_paths": (string)[],"price_cop_per_kg": number,"product_id": number,"published_at": string | null,"quality_grade": Database["public"]['Enums']["quality_grade"],"quantity_kg": number,"status": Database["public"]['Enums']["listing_status"],"updated_at": string,"variety": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "available_from"?: string,"available_kg": number,"available_until": string,"created_at"?: string,"description"?: string | null,"farm_id": string,"farmer_id": string,"harvest_on"?: string | null,"id"?: string,"min_order_kg": number,"municipality_code": string,"photo_paths"?: (string)[],"price_cop_per_kg": number,"product_id": number,"published_at"?: string | null,"quality_grade"?: Database["public"]['Enums']["quality_grade"],"quantity_kg": number,"status"?: Database["public"]['Enums']["listing_status"],"updated_at"?: string,"variety"?: string | null
                  }
                  Update: {
                    "available_from"?: string,"available_kg"?: number,"available_until"?: string,"created_at"?: string,"description"?: string | null,"farm_id"?: string,"farmer_id"?: string,"harvest_on"?: string | null,"id"?: string,"min_order_kg"?: number,"municipality_code"?: string,"photo_paths"?: (string)[],"price_cop_per_kg"?: number,"product_id"?: number,"published_at"?: string | null,"quality_grade"?: Database["public"]['Enums']["quality_grade"],"quantity_kg"?: number,"status"?: Database["public"]['Enums']["listing_status"],"updated_at"?: string,"variety"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "listings_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_farmer_id_fkey"
      columns: ["farmer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_municipality_fk"
      columns: ["municipality_code"]
isOneToOne: false
      referencedRelation: "municipalities"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "listings_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"load_bids": {
                  Row: {
                    "amount_cop": number,"carrier_id": string,"created_at": string,"id": string,"load_id": string,"message": string | null,"status": Database["public"]['Enums']["bid_status"],"updated_at": string,"vehicle_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cop": number,"carrier_id": string,"created_at"?: string,"id"?: string,"load_id": string,"message"?: string | null,"status"?: Database["public"]['Enums']["bid_status"],"updated_at"?: string,"vehicle_id": string
                  }
                  Update: {
                    "amount_cop"?: number,"carrier_id"?: string,"created_at"?: string,"id"?: string,"load_id"?: string,"message"?: string | null,"status"?: Database["public"]['Enums']["bid_status"],"updated_at"?: string,"vehicle_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "load_bids_carrier_id_fkey"
      columns: ["carrier_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "load_bids_load_id_fkey"
      columns: ["load_id"]
isOneToOne: false
      referencedRelation: "loads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "load_bids_vehicle_id_fkey"
      columns: ["vehicle_id"]
isOneToOne: false
      referencedRelation: "vehicles"
      referencedColumns: ["id"]
    }
                  ]
                },"loads": {
                  Row: {
                    "agreed_rate_cop": number | null,"booked_at": string | null,"cancelled_at": string | null,"carrier_id": string | null,"created_at": string,"deliver_by": string,"delivered_at": string | null,"destination_location_id": string,"destination_municipality_code": string,"farmer_id": string,"id": string,"order_id": string,"origin_farm_id": string,"origin_municipality_code": string,"picked_up_at": string | null,"pickup_on": string,"product_id": number,"required_body": Database["public"]['Enums']["body_type"] | null,"shipper_id": string,"status": Database["public"]['Enums']["load_status"],"target_rate_cop": number | null,"updated_at": string,"vehicle_id": string | null,"weight_kg": number
                  }
                  ComputedFields: never
                  Insert: {
                    "agreed_rate_cop"?: number | null,"booked_at"?: string | null,"cancelled_at"?: string | null,"carrier_id"?: string | null,"created_at"?: string,"deliver_by": string,"delivered_at"?: string | null,"destination_location_id": string,"destination_municipality_code": string,"farmer_id": string,"id"?: string,"order_id": string,"origin_farm_id": string,"origin_municipality_code": string,"picked_up_at"?: string | null,"pickup_on": string,"product_id": number,"required_body"?: Database["public"]['Enums']["body_type"] | null,"shipper_id": string,"status"?: Database["public"]['Enums']["load_status"],"target_rate_cop"?: number | null,"updated_at"?: string,"vehicle_id"?: string | null,"weight_kg": number
                  }
                  Update: {
                    "agreed_rate_cop"?: number | null,"booked_at"?: string | null,"cancelled_at"?: string | null,"carrier_id"?: string | null,"created_at"?: string,"deliver_by"?: string,"delivered_at"?: string | null,"destination_location_id"?: string,"destination_municipality_code"?: string,"farmer_id"?: string,"id"?: string,"order_id"?: string,"origin_farm_id"?: string,"origin_municipality_code"?: string,"picked_up_at"?: string | null,"pickup_on"?: string,"product_id"?: number,"required_body"?: Database["public"]['Enums']["body_type"] | null,"shipper_id"?: string,"status"?: Database["public"]['Enums']["load_status"],"target_rate_cop"?: number | null,"updated_at"?: string,"vehicle_id"?: string | null,"weight_kg"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "loads_carrier_id_fkey"
      columns: ["carrier_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loads_destination_location_id_fkey"
      columns: ["destination_location_id"]
isOneToOne: false
      referencedRelation: "delivery_locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loads_destination_municipality_fk"
      columns: ["destination_municipality_code"]
isOneToOne: false
      referencedRelation: "municipalities"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "loads_farmer_id_fkey"
      columns: ["farmer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loads_order_id_fkey"
      columns: ["order_id"]
isOneToOne: true
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loads_origin_farm_id_fkey"
      columns: ["origin_farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loads_origin_municipality_fk"
      columns: ["origin_municipality_code"]
isOneToOne: false
      referencedRelation: "municipalities"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "loads_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loads_shipper_id_fkey"
      columns: ["shipper_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loads_vehicle_id_fkey"
      columns: ["vehicle_id"]
isOneToOne: false
      referencedRelation: "vehicles"
      referencedColumns: ["id"]
    }
                  ]
                },"municipalities": {
                  Row: {
                    "centroid_lat": number,"centroid_lng": number,"code": string,"department_code": string,"department_name": string,"kind": string,"name": string,"search_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "centroid_lat": number,"centroid_lng": number,"code": string,"department_code": string,"department_name": string,"kind": string,"name": string,"search_name"?: never
                  }
                  Update: {
                    "centroid_lat"?: number,"centroid_lng"?: number,"code"?: string,"department_code"?: string,"department_name"?: string,"kind"?: string,"name"?: string,"search_name"?: never
                  }
                  Relationships: [
                    
                  ]
                },"orders": {
                  Row: {
                    "accepted_at": string | null,"buyer_id": string,"completed_at": string | null,"created_at": string,"delivered_at": string | null,"delivery_location_id": string | null,"expires_at": string,"farmer_id": string,"id": string,"listing_id": string,"notes": string | null,"price_cop_per_kg": number,"quantity_kg": number,"requested_delivery_on": string | null,"status": Database["public"]['Enums']["order_status"],"status_reason": string | null,"subtotal_cop": number,"transport_mode": Database["public"]['Enums']["transport_mode"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"buyer_id": string,"completed_at"?: string | null,"created_at"?: string,"delivered_at"?: string | null,"delivery_location_id"?: string | null,"expires_at"?: string,"farmer_id": string,"id"?: string,"listing_id": string,"notes"?: string | null,"price_cop_per_kg": number,"quantity_kg": number,"requested_delivery_on"?: string | null,"status"?: Database["public"]['Enums']["order_status"],"status_reason"?: string | null,"subtotal_cop": number,"transport_mode": Database["public"]['Enums']["transport_mode"],"updated_at"?: string
                  }
                  Update: {
                    "accepted_at"?: string | null,"buyer_id"?: string,"completed_at"?: string | null,"created_at"?: string,"delivered_at"?: string | null,"delivery_location_id"?: string | null,"expires_at"?: string,"farmer_id"?: string,"id"?: string,"listing_id"?: string,"notes"?: string | null,"price_cop_per_kg"?: number,"quantity_kg"?: number,"requested_delivery_on"?: string | null,"status"?: Database["public"]['Enums']["order_status"],"status_reason"?: string | null,"subtotal_cop"?: number,"transport_mode"?: Database["public"]['Enums']["transport_mode"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_buyer_id_fkey"
      columns: ["buyer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_delivery_location_id_fkey"
      columns: ["delivery_location_id"]
isOneToOne: false
      referencedRelation: "delivery_locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_farmer_id_fkey"
      columns: ["farmer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "active": boolean,"category": string,"id": number,"name_en": string,"name_es": string,"perishable": boolean,"slug": string,"suggested_body": Database["public"]['Enums']["body_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"category": string,"id"?: never,"name_en": string,"name_es": string,"perishable"?: boolean,"slug": string,"suggested_body"?: Database["public"]['Enums']["body_type"]
                  }
                  Update: {
                    "active"?: boolean,"category"?: string,"id"?: never,"name_en"?: string,"name_es"?: string,"perishable"?: boolean,"slug"?: string,"suggested_body"?: Database["public"]['Enums']["body_type"]
                  }
                  Relationships: [
                    
                  ]
                },"profile_private": {
                  Row: {
                    "document_number": string | null,"document_type": Database["public"]['Enums']["document_type"] | null,"legal_name": string | null,"phone": string | null,"review_note": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"submitted_at": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "document_number"?: string | null,"document_type"?: Database["public"]['Enums']["document_type"] | null,"legal_name"?: string | null,"phone"?: string | null,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"submitted_at"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "document_number"?: string | null,"document_type"?: Database["public"]['Enums']["document_type"] | null,"legal_name"?: string | null,"phone"?: string | null,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"submitted_at"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_private_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_private_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "business_name": string | null,"country_code": string,"created_at": string,"display_name": string,"id": string,"municipality_code": string | null,"rating_avg": number,"rating_count": number,"role": Database["public"]['Enums']["app_role"],"updated_at": string,"verification_status": Database["public"]['Enums']["verification_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "business_name"?: string | null,"country_code"?: string,"created_at"?: string,"display_name": string,"id": string,"municipality_code"?: string | null,"rating_avg"?: number,"rating_count"?: number,"role": Database["public"]['Enums']["app_role"],"updated_at"?: string,"verification_status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Update: {
                    "business_name"?: string | null,"country_code"?: string,"created_at"?: string,"display_name"?: string,"id"?: string,"municipality_code"?: string | null,"rating_avg"?: number,"rating_count"?: number,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string,"verification_status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_municipality_fk"
      columns: ["municipality_code"]
isOneToOne: false
      referencedRelation: "municipalities"
      referencedColumns: ["code"]
    }
                  ]
                },"shipment_events": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"event_type": Database["public"]['Enums']["shipment_event_type"],"id": number,"lat": number | null,"lng": number | null,"load_id": string,"note": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"event_type": Database["public"]['Enums']["shipment_event_type"],"id"?: never,"lat"?: number | null,"lng"?: number | null,"load_id": string,"note"?: string | null
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"event_type"?: Database["public"]['Enums']["shipment_event_type"],"id"?: never,"lat"?: number | null,"lng"?: number | null,"load_id"?: string,"note"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "shipment_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shipment_events_load_id_fkey"
      columns: ["load_id"]
isOneToOne: false
      referencedRelation: "loads"
      referencedColumns: ["id"]
    }
                  ]
                },"vehicles": {
                  Row: {
                    "active": boolean,"body_type": Database["public"]['Enums']["body_type"],"capacity_kg": number,"carrier_id": string,"created_at": string,"id": string,"plate": string,"soat_expires_on": string,"tecnomecanica_expires_on": string | null,"updated_at": string,"vehicle_class": Database["public"]['Enums']["vehicle_class"],"verification_status": Database["public"]['Enums']["verification_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"body_type": Database["public"]['Enums']["body_type"],"capacity_kg": number,"carrier_id": string,"created_at"?: string,"id"?: string,"plate": string,"soat_expires_on": string,"tecnomecanica_expires_on"?: string | null,"updated_at"?: string,"vehicle_class": Database["public"]['Enums']["vehicle_class"],"verification_status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Update: {
                    "active"?: boolean,"body_type"?: Database["public"]['Enums']["body_type"],"capacity_kg"?: number,"carrier_id"?: string,"created_at"?: string,"id"?: string,"plate"?: string,"soat_expires_on"?: string,"tecnomecanica_expires_on"?: string | null,"updated_at"?: string,"vehicle_class"?: Database["public"]['Enums']["vehicle_class"],"verification_status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "vehicles_carrier_id_fkey"
      columns: ["carrier_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_bid":
{ Args: { "p_bid_id": string }; Returns: string
                           },
"admin_review_vehicle":
{ Args: { "p_approve": boolean,"p_vehicle_id": string }; Returns: Database["public"]['Enums']["verification_status"]
                           },
"admin_review_verification":
{ Args: { "p_approve": boolean,"p_note"?: string,"p_user_id": string }; Returns: Database["public"]['Enums']["verification_status"]
                           },
"admin_set_suspended":
{ Args: { "p_note": string,"p_suspended": boolean,"p_user_id": string }; Returns: Database["public"]['Enums']["verification_status"]
                           },
"cancel_order":
{ Args: { "p_order_id": string,"p_reason"?: string }; Returns: Database["public"]['Enums']["order_status"]
                           },
"carrier_unbook":
{ Args: { "p_load_id": string,"p_reason": string }; Returns: undefined
                           },
"confirm_delivery":
{ Args: { "p_code": string,"p_load_id": string }; Returns: boolean
                           },
"confirm_pickup":
{ Args: { "p_code": string,"p_load_id": string }; Returns: boolean
                           },
"confirm_receipt":
{ Args: { "p_order_id": string }; Returns: Database["public"]['Enums']["order_status"]
                           },
"custom_access_token_hook":
{ Args: { "event": Json }; Returns: Json
                           },
"get_load_stops":
{ Args: { "p_load_id": string }; Returns: {
              "details": string,"lat": number,"lng": number,"municipality_code": string,"name": string,"stop": string
            }[]
                           },
"get_my_load_code":
{ Args: { "p_load_id": string }; Returns: string
                           },
"get_order_contacts":
{ Args: { "p_order_id": string }; Returns: {
              "display_name": string,"party": string,"phone": string
            }[]
                           },
"mark_order_dispatched":
{ Args: { "p_order_id": string }; Returns: Database["public"]['Enums']["order_status"]
                           },
"place_bid":
{ Args: { "p_amount_cop": number,"p_load_id": string,"p_message"?: string,"p_vehicle_id": string }; Returns: string
                           },
"place_order":
{ Args: { "p_delivery_location_id"?: string,"p_listing_id": string,"p_notes"?: string,"p_quantity_kg": number,"p_requested_delivery_on"?: string,"p_transport_mode": Database["public"]['Enums']["transport_mode"] }; Returns: string
                           },
"post_location":
{ Args: { "p_lat": number,"p_lng": number,"p_load_id": string }; Returns: undefined
                           },
"respond_to_order":
{ Args: { "p_accept": boolean,"p_order_id": string,"p_pickup_on"?: string,"p_reason"?: string }; Returns: Database["public"]['Enums']["order_status"]
                           },
"search_municipalities":
{ Args: { "p_limit"?: number,"p_query": string }; Returns: {
              "centroid_lat": number,
"centroid_lng": number,
"code": string,
"department_code": string,
"department_name": string,
"kind": string,
"name": string,
"search_name": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "municipalities"
        isOneToOne: false
        isSetofReturn: true
      } },
"set_load_target_rate":
{ Args: { "p_load_id": string,"p_rate_cop": number }; Returns: undefined
                           },
"submit_verification":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["verification_status"]
                           },
"withdraw_bid":
{ Args: { "p_bid_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "app_role": "farmer"|"buyer"|"carrier"|"admin","bid_status": "active"|"accepted"|"rejected"|"withdrawn","body_type": "estacas"|"furgon"|"refrigerado"|"plataforma","document_type": "CC"|"CE"|"NIT"|"PPT"|"PASSPORT","listing_status": "draft"|"published"|"sold_out"|"expired"|"withdrawn","load_status": "posted"|"booked"|"picked_up"|"delivered"|"cancelled","order_status": "pending"|"accepted"|"rejected"|"cancelled"|"expired"|"in_transit"|"delivered"|"completed"|"disputed","quality_grade": "extra"|"primera"|"segunda"|"industrial","shipment_event_type": "posted"|"booked"|"unbooked"|"picked_up"|"location"|"incident"|"delivered"|"cancelled"|"code_failed","transport_mode": "platform"|"buyer_arranged"|"farmer_delivers","vehicle_class": "camioneta"|"turbo"|"sencillo"|"doble_troque"|"minimula"|"tractomula","verification_status": "unverified"|"pending"|"verified"|"rejected"|"suspended"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["farmer", "buyer", "carrier", "admin"],"bid_status": ["active", "accepted", "rejected", "withdrawn"],"body_type": ["estacas", "furgon", "refrigerado", "plataforma"],"document_type": ["CC", "CE", "NIT", "PPT", "PASSPORT"],"listing_status": ["draft", "published", "sold_out", "expired", "withdrawn"],"load_status": ["posted", "booked", "picked_up", "delivered", "cancelled"],"order_status": ["pending", "accepted", "rejected", "cancelled", "expired", "in_transit", "delivered", "completed", "disputed"],"quality_grade": ["extra", "primera", "segunda", "industrial"],"shipment_event_type": ["posted", "booked", "unbooked", "picked_up", "location", "incident", "delivered", "cancelled", "code_failed"],"transport_mode": ["platform", "buyer_arranged", "farmer_delivers"],"vehicle_class": ["camioneta", "turbo", "sencillo", "doble_troque", "minimula", "tractomula"],"verification_status": ["unverified", "pending", "verified", "rejected", "suspended"]
          }
        }
} as const
