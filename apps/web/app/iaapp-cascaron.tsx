'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
type IconProps = { className?: string };
const SvgWrap = ({ className = 'w-4 h-4', children }: { className?: string; children: React.ReactNode }) => (
<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
{children}
</svg>
);
const MessageSquare = ({ className }: IconProps) => <SvgWrap className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></SvgWrap>;
const Users = ({ className }: IconProps) => <SvgWrap className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></SvgWrap>;
const Bot = ({ className }: IconProps) => <SvgWrap className={className}><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/></SvgWrap>;
const Bell = ({ className }: IconProps) => <SvgWrap className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></SvgWrap>;
const User = ({ className }: IconProps) => <SvgWrap className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgWrap>;
const Search = ({ className }: IconProps) => <SvgWrap className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></SvgWrap>;
const Plus = ({ className }: IconProps) => <SvgWrap className={className}><path d="M5 12h14"/><path d="M12 5v14"/></SvgWrap>;
const Send = ({ className }: IconProps) => <SvgWrap className={className}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></SvgWrap>;
const Paperclip = ({ className }: IconProps) => <SvgWrap className={className}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></SvgWrap>;
const Camera = ({ className }: IconProps) => <SvgWrap className={className}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></SvgWrap>;
const Mic = ({ className }: IconProps) => <SvgWrap className={className}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></SvgWrap>;
const Wrench = ({ className }: IconProps) => <SvgWrap className={className}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></SvgWrap>;
const Sparkles = ({ className }: IconProps) => <SvgWrap className={className}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></SvgWrap>;
const Pin = ({ className }: IconProps) => <SvgWrap className={className}><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></SvgWrap>;
const VolumeX = ({ className }: IconProps) => <SvgWrap className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></SvgWrap>;
const Archive = ({ className }: IconProps) => <SvgWrap className={className}><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></SvgWrap>;
const Check = ({ className }: IconProps) => <SvgWrap className={className}><path d="M20 6 9 17l-5-5"/></SvgWrap>;
const CheckCheck = ({ className }: IconProps) => <SvgWrap className={className}><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></SvgWrap>;
const Reply = ({ className }: IconProps) => <SvgWrap className={className}><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></SvgWrap>;
const Copy = ({ className }: IconProps) => <SvgWrap className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></SvgWrap>;
const Shield = ({ className }: IconProps) => <SvgWrap className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></SvgWrap>;
const Sliders = ({ className }: IconProps) => <SvgWrap className={className}><line x1="4" x2="20" y1="21" y2="14"/><line x1="4" x2="20" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/></SvgWrap>;
const ChevronRight = ({ className }: IconProps) => <SvgWrap className={className}><path d="m9 18 6-6-6-6"/></SvgWrap>;
const ChevronLeft = ({ className }: IconProps) => <SvgWrap className={className}><path d="m15 18-6-6 6-6"/></SvgWrap>;
const Activity = ({ className }: IconProps) => <SvgWrap className={className}><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></SvgWrap>;
const Terminal = ({ className }: IconProps) => <SvgWrap className={className}><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></SvgWrap>;
const Server = ({ className }: IconProps) => <SvgWrap className={className}><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></SvgWrap>;
const Key = ({ className }: IconProps) => <SvgWrap className={className}><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></SvgWrap>;
const AlertCircle = ({ className }: IconProps) => <SvgWrap className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></SvgWrap>;
const Clock = ({ className }: IconProps) => <SvgWrap className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgWrap>;
const Smartphone = ({ className }: IconProps) => <SvgWrap className={className}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></SvgWrap>;
const Monitor = ({ className }: IconProps) => <SvgWrap className={className}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></SvgWrap>;
const LogOut = ({ className }: IconProps) => <SvgWrap className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></SvgWrap>;
const UserPlus = ({ className }: IconProps) => <SvgWrap className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></SvgWrap>;
const Ban = ({ className }: IconProps) => <SvgWrap className={className}><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></SvgWrap>;
const FileText = ({ className }: IconProps) => <SvgWrap className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></SvgWrap>;
const RefreshCw = ({ className }: IconProps) => <SvgWrap className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></SvgWrap>;
const X = ({ className }: IconProps) => <SvgWrap className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></SvgWrap>;
const Building2 = ({ className }: IconProps) => <SvgWrap className={className}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></SvgWrap>;
export type SessionMode = 'visitor' | 'identified';
export type SystemState = 'ready' | 'loading' | 'empty' | 'offline' | 'error';
export type ParticipantKind = 'human' | 'ai' | 'group';
export type ConnectionState = 'available' | 'pending_config' | 'connected' | 'error';
export interface IAAppUser {
id: string;
iaAppNumber: string; // Asignado exclusivamente por el servicio de identidad en backend
displayName: string;
handle: string;
bio: string;
avatarLabel: string;
presence: 'online' | 'busy' | 'offline';
role: 'user' | 'admin' | 'visitor';
organization?: string;
}
export interface RoomParticipant {
id: string;
name: string;
kind: 'human' | 'ai';
provider?: string;
role: 'owner' | 'admin' | 'member' | 'agent_operator';
iaAppNumber?: string;
presence: 'online' | 'offline' | 'idle';
permissions: string[];
}
export interface AgentActionRecord {
id: string;
agentName: string;
toolName: string;
summary: string;
authScope: string;
authorizedBy: string;
timestamp: string;
status: 'executed' | 'pending_approval' | 'denied';
}
export interface ChatMessage {
id: string;
roomId: string;
senderId: string;
senderName: string;
senderKind: 'human' | 'ai' | 'system';
senderBadge?: string;
text: string;
timestamp: string;
dateGroup: string;
status: 'sent' | 'delivered' | 'read' | 'pending_backend';
replyTo?: { id: string; senderName: string; text: string };
reactions: Record<string, number>;
agentAction?: AgentActionRecord;
isFixture?: boolean;
}
export interface ConversationRoom {
id: string;
title: string;
subtitle: string;
kind: ParticipantKind;
avatarLabel: string;
lastMessage: string;
lastTime: string;
unreadCount: number;
online: boolean;
pinned: boolean;
muted: boolean;
archived: boolean;
isFixture: boolean;
participants: RoomParticipant[];
}
export interface ContactItem {
id: string;
name: string;
iaAppNumber: string;
avatarLabel: string;
statusText: string;
online: boolean;
blocked: boolean;
requestStatus: 'accepted' | 'pending_incoming' | 'pending_outgoing' | 'none';
organization?: string;
isFixture: boolean;
}
export interface IntelligenceProviderItem {
id: string;
name: string;
vendor: string;
category: 'openai' | 'google' | 'cerebras' | 'vforge' | 'mcp' | 'future';
logoSymbol: string;
description: string;
state: ConnectionState;
capabilities: string[];
grantedScopes: string[];
lastActivity?: string;
endpointContract: string;
}
export interface MCPServerItem {
id: string;
name: string;
endpoint: string;
status: 'connected' | 'standby' | 'disconnected';
tools: { name: string; scope: string; description: string; requiresApproval: boolean }[];
skills: string[];
orgScope: string;
lastAudit: string;
}
export interface ActivityEventItem {
id: string;
type: 'message' | 'group' | 'contact' | 'agent' | 'auth' | 'mcp_tool' | 'system';
title: string;
detail: string;
timestamp: string;
dateLabel: string;
read: boolean;
actor: string;
authRef?: string;
}
const INITIAL_ROOMS: ConversationRoom[] = [
{
id: 'room-arquitectura',
title: 'Proyecto Arquitectura',
subtitle: 'Grupo mixto · 2 humanos, 2 inteligencias',
kind: 'group',
avatarLabel: 'PA',
lastMessage: 'Asistente de Proyecto: Revisión de contratos de adaptadores completada.',
lastTime: '18:42',
unreadCount: 2,
online: true,
pinned: true,
muted: false,
archived: false,
isFixture: true,
participants: [
{
id: 'u-luis',
name: 'Luis',
kind: 'human',
role: 'owner',
iaAppNumber: 'IA-0001-0001',
presence: 'online',
permissions: ['admin.all', 'agents.invite', 'mcp.authorize']
},
{
id: 'u-ana',
name: 'Ana',
kind: 'human',
role: 'admin',
iaAppNumber: 'IA-0001-0104',
presence: 'online',
permissions: ['messages.send', 'agents.invoke']
},
{
id: 'ai-gemini',
name: 'Gemini',
kind: 'ai',
provider: 'Google / Gemini',
role: 'agent_operator',
presence: 'online',
permissions: ['context.read', 'summary.generate']
},
{
id: 'ai-asistente',
name: 'Asistente de Proyecto',
kind: 'ai',
provider: 'IA.app / VFORGE',
role: 'agent_operator',
presence: 'online',
permissions: ['vforge.project.status', 'mcp.mailbox.read']
}
]
},
{
id: 'room-vforge-agent',
title: 'Vulcano · Fragua VFORGE',
subtitle: 'Agente privado de infraestructura · MCP',
kind: 'ai',
avatarLabel: 'VF',
lastMessage: 'Pulso verificado: Relay activo y contratos de adaptadores listos.',
lastTime: '18:15',
unreadCount: 0,
online: true,
pinned: true,
muted: false,
archived: false,
isFixture: true,
participants: [
{
id: 'u-luis',
name: 'Luis',
kind: 'human',
role: 'owner',
iaAppNumber: 'IA-0001-0001',
presence: 'online',
permissions: ['admin.all']
},
{
id: 'ai-vulcano',
name: 'Vulcano · Fragua VFORGE',
kind: 'ai',
provider: 'VFORGE MCP',
role: 'agent_operator',
presence: 'online',
permissions: ['vforge.status', 'vforge.dispatch']
}
]
},
{
id: 'room-ana',
title: 'Ana (Equipo Producto)',
subtitle: 'Persona · IA-0001-0104',
kind: 'human',
avatarLabel: 'AN',
lastMessage: '¿Revisamos los permisos del conector antes de abrir la sala?',
lastTime: '17:20',
unreadCount: 1,
online: true,
pinned: false,
muted: false,
archived: false,
isFixture: true,
participants: [
{
id: 'u-luis',
name: 'Luis',
kind: 'human',
role: 'owner',
iaAppNumber: 'IA-0001-0001',
presence: 'online',
permissions: ['messages.send']
},
{
id: 'u-ana',
name: 'Ana',
kind: 'human',
role: 'member',
iaAppNumber: 'IA-0001-0104',
presence: 'online',
permissions: ['messages.send']
}
]
},
{
id: 'room-cerebras',
title: 'Cerebras Fast Inference',
subtitle: 'Inteligencia · Pendiente de vinculación OAuth',
kind: 'ai',
avatarLabel: 'CB',
lastMessage: 'Conecta tu autorización en el Centro de Conexiones para activar.',
lastTime: 'Ayer',
unreadCount: 0,
online: false,
pinned: false,
muted: true,
archived: false,
isFixture: true,
participants: [
{
id: 'ai-cerebras',
name: 'Cerebras',
kind: 'ai',
provider: 'Cerebras',
role: 'agent_operator',
presence: 'offline',
permissions: []
}
]
}
];
const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
'room-arquitectura': [
{
id: 'm-1',
roomId: 'room-arquitectura',
senderId: 'u-luis',
senderName: 'Luis',
senderKind: 'human',
text: 'Equipo, esta sala mixta define la arquitectura de IA.app CHAT. Cero pantallas de Matrix ni formularios técnicos.',
timestamp: '18:38',
dateGroup: 'HOY · DEMOSTRACIÓN ETIQUETADA',
status: 'read',
reactions: { '✓': 2, '⚡': 1 },
isFixture: true
},
{
id: 'm-2',
roomId: 'room-arquitectura',
senderId: 'u-ana',
senderName: 'Ana',
senderKind: 'human',
text: 'De acuerdo. El modo visitante permite recorrer toda la interfaz sin pedir contraseñas, y el modo identificado conecta con Better Auth.',
timestamp: '18:39',
dateGroup: 'HOY · DEMOSTRACIÓN ETIQUETADA',
status: 'read',
reactions: { '👍': 1 },
isFixture: true
},
{
id: 'm-3',
roomId: 'room-arquitectura',
senderId: 'ai-gemini',
senderName: 'Gemini',
senderKind: 'ai',
senderBadge: 'AGENTE CONECTADO',
text: 'He verificado la separación de adaptadores: IdentityProvider, MessagingProvider, ContactsProvider, AgentsProvider, MCPProvider, NotificationProvider y PermissionsProvider están desacoplados de la vista.',
timestamp: '18:40',
dateGroup: 'HOY · DEMOSTRACIÓN ETIQUETADA',
status: 'read',
replyTo: {
id: 'm-1',
senderName: 'Luis',
text: 'Equipo, esta sala mixta define la arquitectura de IA.app CHAT...'
},
reactions: { '⚡': 2 },
isFixture: true
},
{
id: 'm-4',
roomId: 'room-arquitectura',
senderId: 'ai-asistente',
senderName: 'Asistente de Proyecto',
senderKind: 'ai',
senderBadge: 'AGENTE IA.app',
text: 'Revisión de contratos de adaptadores completada. Adjunto el registro auditado de la acción ejecutada en la sala.',
timestamp: '18:42',
dateGroup: 'HOY · DEMOSTRACIÓN ETIQUETADA',
status: 'delivered',
reactions: {},
agentAction: {
id: 'act-901',
agentName: 'Asistente de Proyecto',
toolName: 'vforge_project_context',
summary: 'Lectura autorizada de estado de contratos en /packages/contracts',
authScope: 'scope:vforge.projects.read',
authorizedBy: 'Luis (IA-0001-0001)',
timestamp: '18:42:10 UTC',
status: 'executed'
},
isFixture: true
}
],
'room-vforge-agent': [
{
id: 'm-vf-1',
roomId: 'room-vforge-agent',
senderId: 'ai-vulcano',
senderName: 'Vulcano · Fragua VFORGE',
senderKind: 'ai',
senderBadge: 'AGENTE VFORGE',
text: 'Pulso verificado: Relay activo y contratos de adaptadores listos. Ningún secreto de proveedor reside en el navegador.',
timestamp: '18:15',
dateGroup: 'HOY · DEMOSTRACIÓN ETIQUETADA',
status: 'read',
reactions: { '✓': 1 },
agentAction: {
id: 'act-902',
agentName: 'Vulcano · Fragua VFORGE',
toolName: 'vforge_apps_health',
summary: 'Verificación de estado de pasarela MCP y buzón pull seguro',
authScope: 'scope:mcp.health.read',
authorizedBy: 'Organización IA.app',
timestamp: '18:15:02 UTC',
status: 'executed'
},
isFixture: true
}
],
'room-ana': [
{
id: 'm-an-1',
roomId: 'room-ana',
senderId: 'u-ana',
senderName: 'Ana',
senderKind: 'human',
text: '¿Revisamos los permisos del conector antes de abrir la sala?',
timestamp: '17:20',
dateGroup: 'HOY · DEMOSTRACIÓN ETIQUETADA',
status: 'read',
reactions: {},
isFixture: true
}
],
'room-cerebras': [
{
id: 'm-cb-1',
roomId: 'room-cerebras',
senderId: 'system',
senderName: 'Sistema IA.app',
senderKind: 'system',
text: 'Este proveedor se encuentra en estado "Pendiente de configuración". Usa el asistente "Conecta tus inteligencias" para autorizarlo.',
timestamp: 'Ayer',
dateGroup: 'ESTADO DE PROVEEDOR',
status: 'read',
reactions: {},
isFixture: true
}
]
};
const INITIAL_CONTACTS: ContactItem[] = [
{
id: 'c-1',
name: 'Luis (Arquitectura)',
iaAppNumber: 'IA-0001-0001 · Backend ID',
avatarLabel: 'LU',
statusText: 'Coordinando infraestructura global',
online: true,
blocked: false,
requestStatus: 'accepted',
organization: 'VFORGE / IA.app',
isFixture: true
},
{
id: 'c-2',
name: 'Ana (Equipo Producto)',
iaAppNumber: 'IA-0001-0104 · Backend ID',
avatarLabel: 'AN',
statusText: 'Disponible para revisión de diseño',
online: true,
blocked: false,
requestStatus: 'accepted',
organization: 'IA.app Core',
isFixture: true
},
{
id: 'c-3',
name: 'Marco (Auditoría Seguridad)',
iaAppNumber: 'IA-0001-0209 · Backend ID',
avatarLabel: 'MA',
statusText: 'Validando alcances OAuth y Better Auth',
online: false,
blocked: false,
requestStatus: 'pending_incoming',
organization: 'SecOps',
isFixture: true
},
{
id: 'c-4',
name: 'Elena (Operaciones)',
iaAppNumber: 'IA-0001-0312 · Backend ID',
avatarLabel: 'EL',
statusText: 'En reunión',
online: false,
blocked: false,
requestStatus: 'accepted',
organization: 'IA.app Ops',
isFixture: true
}
];
const INITIAL_PROVIDERS: IntelligenceProviderItem[] = [
{
id: 'prov-vforge',
name: 'Agentes privados de VFORGE',
vendor: 'VFORGE Ecosystem',
category: 'vforge',
logoSymbol: '▽',
description: 'Orquestación de infraestructura, lectura de contexto de proyectos y ejecución auditada mediante Meta MCP.',
state: 'connected',
capabilities: [
'Leer perfil autorizado',
'Consultar proyectos permitidos',
'Ejecutar skills aprobadas en servidor',
'Buzón MCP pull seguro por sala'
],
grantedScopes: ['vforge.projects.read', 'vforge.mailbox.pull', 'vforge.skills.list'],
lastActivity: 'Hace 4 min · Evidencia verificada en sala Proyecto Arquitectura',
endpointContract: '/api/backend/mcp/vforge'
},
{
id: 'prov-gemini',
name: 'Gemini / Google',
vendor: 'Google Cloud / Vertex & Gemini API',
category: 'google',
logoSymbol: '✦',
description: 'Agente multimodal para análisis técnico, síntesis de salas mixtas y coordinación de contexto.',
state: 'connected',
capabilities: [
'Participar en grupos mixtos por mención',
'Resumir hilos autorizados',
'Invocar herramientas MCP aprobadas'
],
grantedScopes: ['room.messages.read_mentioned', 'room.messages.reply'],
lastActivity: 'Hace 6 min · Respuesta en Proyecto Arquitectura',
endpointContract: '/api/backend/providers/google'
},
{
id: 'prov-openai',
name: 'ChatGPT / OpenAI',
vendor: 'OpenAI API Platform',
category: 'openai',
logoSymbol: '◎',
description: 'Modelos de razonamiento y asistencia para salas de trabajo. No importa ni lee chats externos de tu cuenta personal.',
state: 'available',
capabilities: [
'Responder en conversaciones donde sea invitado',
'Ejecutar análisis estructurado bajo autorización',
'Sin acceso a historial externo de ChatGPT'
],
grantedScopes: [],
endpointContract: '/api/backend/providers/openai'
},
{
id: 'prov-cerebras',
name: 'Cerebras',
vendor: 'Cerebras Wafer-Scale Inference',
category: 'cerebras',
logoSymbol: '⚡',
description: 'Inferencia de ultra baja latencia para respuestas instantáneas y clasificación en tiempo real.',
state: 'pending_config',
capabilities: [
'Inferencia de alta velocidad en salas autorizadas',
'Síntesis instantánea de actividad'
],
grantedScopes: [],
endpointContract: '/api/backend/providers/cerebras'
},
{
id: 'prov-mcp',
name: 'Agentes compatibles con MCP',
vendor: 'Model Context Protocol Standard',
category: 'mcp',
logoSymbol: '⌘',
description: 'Conecta servidores y agentes compatibles con el protocolo abierto MCP mediante validación en servidor.',
state: 'connected',
capabilities: [
'Reclamo de código de emparejamiento de un solo uso',
'Suscripción a buzón de sala autorizada',
'Auditoría completa de cada herramienta invocada'
],
grantedScopes: ['mcp.pairing.claim', 'mcp.events.subscribe'],
lastActivity: 'Hoy 18:10 · Buzón MCP verificado',
endpointContract: '/mcp'
},
{
id: 'prov-future',
name: 'Proveedores Futuros (Anthropic / Nebius)',
vendor: 'Adaptador Abierto IA.app',
category: 'future',
logoSymbol: '◇',
description: 'Ranura de expansión preparada en AgentsProvider para conectar nuevos motores sin alterar la interfaz.',
state: 'available',
capabilities: [
'Contrato estándar AgentsProvider listo',
'Autorización OAuth / Token Relay en servidor'
],
grantedScopes: [],
endpointContract: '/api/backend/providers/custom'
}
];
const INITIAL_MCP_SERVERS: MCPServerItem[] = [
{
id: 'mcp-vforge-core',
name: 'VFORGE Meta MCP',
endpoint: 'https://vforge.site/api/mcp',
status: 'connected',
orgScope: 'Organización Principal · Validado en servidor',
lastAudit: 'Hoy 18:42 UTC · 0 secretos en cliente',
skills: ['metodo-apps', 'pwa-agencia-premium', 'auditoria-sanidad'],
tools: [
{
name: 'vforge_project_status',
scope: 'scope:vforge.projects.read',
description: 'Consulta el estado real de los proyectos autorizados.',
requiresApproval: false
},
{
name: 'vforge_project_context',
scope: 'scope:vforge.context.read',
description: 'Lee referencias, documentos y estado de despliegue.',
requiresApproval: false
},
{
name: 'vulcano_dispatch',
scope: 'scope:vforge.dispatch.write',
description: 'Encola una tarea real en la fragua de construcción.',
requiresApproval: true
}
]
},
{
id: 'mcp-iaapp-mailbox',
name: 'IA.app Pull Mailbox MCP',
endpoint: 'https://iaapp.live/mcp',
status: 'connected',
orgScope: 'Salas autorizadas por usuario',
lastAudit: 'Hoy 18:30 UTC · Emparejamiento por código único',
skills: ['pairing-one-time-code', 'room-event-pull'],
tools: [
{
name: 'mailbox.pull_messages',
scope: 'scope:iaapp.mailbox.read',
description: 'Consulta buzones autorizados para el agente vinculado.',
requiresApproval: false
},
{
name: 'mailbox.post_reply',
scope: 'scope:iaapp.mailbox.write',
description: 'Publica mensajes en la sala donde el agente fue invitado.',
requiresApproval: true
}
]
}
];
const INITIAL_ACTIVITY: ActivityEventItem[] = [
{
id: 'ev-1',
type: 'mcp_tool',
title: 'Acción de herramienta ejecutada',
detail: 'Asistente de Proyecto ejecutó "vforge_project_context" en Proyecto Arquitectura.',
timestamp: '18:42',
dateLabel: 'HOY',
read: false,
actor: 'Asistente de Proyecto (IA)',
authRef: 'scope:vforge.projects.read'
},
{
id: 'ev-2',
type: 'group',
title: 'Invitación a grupo mixto activa',
detail: 'Gemini y Asistente de Proyecto operan con permisos por mención en Proyecto Arquitectura.',
timestamp: '18:39',
dateLabel: 'HOY',
read: false,
actor: 'Luis (IA-0001-0001)'
},
{
id: 'ev-3',
type: 'contact',
title: 'Solicitud de contacto pendiente',
detail: 'Marco (IA-0001-0209) solicitó agregarte a su directorio de IA.app.',
timestamp: '17:50',
dateLabel: 'HOY',
read: false,
actor: 'Marco (SecOps)'
},
{
id: 'ev-4',
type: 'auth',
title: 'Proveedor pendiente de configuración',
detail: 'Cerebras requiere completar el asistente de autorización antes de habilitar su conexión.',
timestamp: 'Ayer',
dateLabel: 'AYER',
read: true,
actor: 'PermissionsProvider'
},
{
id: 'ev-5',
type: 'system',
title: 'Arquitectura de adaptadores verificada',
detail: 'Better Auth / OAuth y el buzón MCP operan sin exponer Matrix ni secretos en el cliente.',
timestamp: 'Ayer',
dateLabel: 'AYER',
read: true,
actor: 'Sistema IA.app'
}
];
export default function App() {
const [showSplash, setShowSplash] = useState<boolean>(true);
const [sessionMode, setSessionMode] = useState<SessionMode>('visitor');
const [surface, setSurface] = useState<'user_app' | 'admin_panel'>('user_app');
const [viewportMode, setViewportMode] = useState<'responsive' | 'mobile_390'>('responsive');
const [systemState, setSystemState] = useState<SystemState>('ready');
const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'agents' | 'activity' | 'profile'>('chats');
const [rooms, setRooms] = useState<ConversationRoom[]>(INITIAL_ROOMS);
const [selectedRoomId, setSelectedRoomId] = useState<string>('room-arquitectura');
const [mobileChatOpen, setMobileChatOpen] = useState<boolean>(false);
const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
const [contacts, setContacts] = useState<ContactItem[]>(INITIAL_CONTACTS);
const [providers, setProviders] = useState<IntelligenceProviderItem[]>(INITIAL_PROVIDERS);
const [mcpServers] = useState<MCPServerItem[]>(INITIAL_MCP_SERVERS);
const [activities, setActivities] = useState<ActivityEventItem[]>(INITIAL_ACTIVITY);
const [roomSearch, setRoomSearch] = useState<string>('');
const [roomFilter, setRoomFilter] = useState<'all' | 'human' | 'ai' | 'group' | 'archived'>('all');
const [forceEmptyRooms, setForceEmptyRooms] = useState<boolean>(false);
const [composerText, setComposerText] = useState<string>('');
const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
const [inChatSearchOpen, setInChatSearchOpen] = useState<boolean>(false);
const [inChatSearchQuery, setInChatSearchQuery] = useState<string>('');
const [contextDrawerOpen, setContextDrawerOpen] = useState<boolean>(false);
const [activeAttachmentSheet, setActiveAttachmentSheet] = useState<
null | 'attach' | 'camera' | 'mic' | 'mcp_tools' | 'invite_ai'
>(null);
const [contactSearch, setContactSearch] = useState<string>('');
const [selectedContactProfile, setSelectedContactProfile] = useState<ContactItem | null>(null);
const [connectionCenterOpen, setConnectionCenterOpen] = useState<boolean>(false);
const [wizardProvider, setWizardProvider] = useState<IntelligenceProviderItem | null>(null);
const [wizardStep, setWizardStep] = useState<number>(1);
const [wizardSelectedScopes, setWizardSelectedScopes] = useState<string[]>([]);
const [newRoomModal, setNewRoomModal] = useState<null | 'direct' | 'group'>(null);
const [newRoomTitle, setNewRoomTitle] = useState<string>('');
const [newGroupHumans] = useState<string[]>(['Ana (Equipo Producto)']);
const [newGroupAgents, setNewGroupAgents] = useState<string[]>(['Gemini', 'Asistente de Proyecto']);
const [activityFilter, setActivityFilter] = useState<string>('all');
const [profileDisplayName, setProfileDisplayName] = useState<string>('Luis de la Torre');
const [profileBio, setProfileBio] = useState<string>('Arquitectura soberana · Humanos e inteligencias en un mismo lugar.');
const [profilePresence, setProfilePresence] = useState<'online' | 'busy' | 'offline'>('online');
const [profileLanguage, setProfileLanguage] = useState<'es-MX' | 'en-US'>('es-MX');
const [profileTheme, setProfileTheme] = useState<'pure-black' | 'deep-graphite'>('pure-black');
const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
const [privacyReadReceipts, setPrivacyReadReceipts] = useState<boolean>(true);
const [adminSection, setAdminSection] = useState<
| 'overview'
| 'users'
| 'orgs'
| 'agents'
| 'providers'
| 'mcp'
| 'skills'
| 'roles'
| 'audit'
| 'contracts'
>('overview');
const [toast, setToast] = useState<{ text: string; tone?: 'neutral' | 'success' | 'warning' } | null>(null);
const toastTimerRef = useRef<number | null>(null);
const showToast = (text: string, tone: 'neutral' | 'success' | 'warning' = 'neutral') => {
if (toastTimerRef.current) {
window.clearTimeout(toastTimerRef.current);
}
setToast({ text, tone });
toastTimerRef.current = window.setTimeout(() => {
setToast(null);
}, 3400);
};
useEffect(() => {
return () => {
if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
};
}, []);
const currentUser: IAAppUser = useMemo(() => {
if (sessionMode === 'visitor') {
return {
id: 'visitor-session',
iaAppNumber: 'SIN ASIGNAR (Modo Visitante)',
displayName: 'Visitante Explorador',
handle: '@visitante',
bio: 'Exploración pública sin cuenta activa. Inicia sesión con IA.app para obtener tu número único.',
avatarLabel: 'VI',
presence: 'online',
role: 'visitor'
};
}
return {
id: 'u-luis',
iaAppNumber: 'IA-0001-0001',
displayName: profileDisplayName,
handle: '@luis',
bio: profileBio,
avatarLabel: 'LU',
presence: profilePresence,
role: 'admin',
organization: 'VFORGE / IA.app'
};
}, [sessionMode, profileDisplayName, profileBio, profilePresence]);
const selectedRoom = useMemo(
() => rooms.find((r) => r.id === selectedRoomId) || rooms[0],
[rooms, selectedRoomId]
);
const filteredRooms = useMemo(() => {
if (forceEmptyRooms) return [];
return rooms
.filter((r) => {
if (roomFilter === 'archived') return r.archived;
if (r.archived) return false;
if (roomFilter === 'human') return r.kind === 'human';
if (roomFilter === 'ai') return r.kind === 'ai';
if (roomFilter === 'group') return r.kind === 'group';
return true;
})
.filter((r) => {
if (!roomSearch.trim()) return true;
const q = roomSearch.toLowerCase();
return (
r.title.toLowerCase().includes(q) ||
r.subtitle.toLowerCase().includes(q) ||
r.lastMessage.toLowerCase().includes(q)
);
})
.sort((a, b) => Number(b.pinned) - Number(a.pinned));
}, [rooms, roomFilter, roomSearch, forceEmptyRooms]);
const currentMessages = useMemo(() => {
if (!selectedRoom) return [];
const list = messagesByRoom[selectedRoom.id] || [];
if (!inChatSearchQuery.trim()) return list;
const q = inChatSearchQuery.toLowerCase();
return list.filter(
(m) => m.text.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q)
);
}, [selectedRoom, messagesByRoom, inChatSearchQuery]);
const filteredContacts = useMemo(() => {
if (!contactSearch.trim()) return contacts;
const q = contactSearch.toLowerCase();
return contacts.filter(
(c) =>
c.name.toLowerCase().includes(q) ||
c.iaAppNumber.toLowerCase().includes(q) ||
c.statusText.toLowerCase().includes(q)
);
}, [contacts, contactSearch]);
const filteredActivities = useMemo(() => {
if (activityFilter === 'all') return activities;
return activities.filter((a) => a.type === activityFilter);
}, [activities, activityFilter]);
const unreadRoomsCount = useMemo(
() => rooms.filter((r) => !r.archived).reduce((acc, r) => acc + r.unreadCount, 0),
[rooms]
);
const unreadActivitiesCount = useMemo(
() => activities.filter((a) => !a.read).length,
[activities]
);
const handleSelectRoom = (roomId: string) => {
setSelectedRoomId(roomId);
setMobileChatOpen(true);
setSelectedMessageIds([]);
setReplyingTo(null);
setRooms((prev) =>
prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
);
};
const handleTogglePinRoom = (roomId: string) => {
setRooms((prev) =>
prev.map((r) => (r.id === roomId ? { ...r, pinned: !r.pinned } : r))
);
showToast('Estado de conversación fijada actualizado.');
};
const handleToggleMuteRoom = (roomId: string) => {
setRooms((prev) =>
prev.map((r) => (r.id === roomId ? { ...r, muted: !r.muted } : r))
);
showToast('Preferencia de silencio actualizada.');
};
const handleToggleArchiveRoom = (roomId: string) => {
setRooms((prev) =>
prev.map((r) => (r.id === roomId ? { ...r, archived: !r.archived } : r))
);
showToast('Conversación movida de bandeja.');
};
const handleMarkRoomRead = (roomId: string) => {
setRooms((prev) =>
prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
);
showToast('Conversación marcada como leída.');
};
const handleSendMessage = (e?: React.FormEvent) => {
if (e) e.preventDefault();
const trimmed = composerText.trim();
if (!trimmed || !selectedRoom) return;
if (sessionMode === 'visitor') {
showToast(
'Modo Visitante: cambia a "Modo Identificado" arriba para enviar mensajes reales o autorizar agentes.',
'warning'
);
return;
}
const now = new Date();
const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
now.getMinutes()
).padStart(2, '0')}`;
const newMsg: ChatMessage = {
id: `m-${Date.now()}`,
roomId: selectedRoom.id,
senderId: currentUser.id,
senderName: currentUser.displayName,
senderKind: 'human',
text: trimmed,
timestamp: timeStr,
dateGroup: 'HOY · SESIÓN IDENTIFICADA',
status: 'pending_backend', // No fabricar confirmaciones de backend cuando aún está en adaptador local
replyTo: replyingTo
? {
id: replyingTo.id,
senderName: replyingTo.senderName,
text: replyingTo.text
}
: undefined,
reactions: {}
};
setMessagesByRoom((prev) => ({
...prev,
[selectedRoom.id]: [...(prev[selectedRoom.id] || []), newMsg]
}));
setRooms((prev) =>
prev.map((r) =>
r.id === selectedRoom.id
? { ...r, lastMessage: `Tú: ${trimmed}`, lastTime: timeStr }
: r
)
);
setComposerText('');
setReplyingTo(null);
showToast(
'Mensaje registrado en el adaptador MessagingProvider (estado: pendiente de confirmación del servidor).',
'success'
);
};
const handleCopyMessage = (text: string) => {
try {
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(text).catch(() => {});
} else {
const area = document.createElement('textarea');
area.value = text;
document.body.appendChild(area);
area.select();
document.execCommand('copy');
document.body.removeChild(area);
}
} catch {
}
showToast('Texto copiado al portapapeles.');
};
const handleToggleSelectMessage = (msgId: string) => {
setSelectedMessageIds((prev) =>
prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
);
};
const handleReaction = (msgId: string, emoji: string) => {
if (!selectedRoom) return;
setMessagesByRoom((prev) => ({
...prev,
[selectedRoom.id]: (prev[selectedRoom.id] || []).map((m) => {
if (m.id !== msgId) return m;
const current = m.reactions[emoji] || 0;
return {
...m,
reactions: { ...m.reactions, [emoji]: current + 1 }
};
})
}));
};
const handleInviteAgentToRoom = (provider: IntelligenceProviderItem) => {
if (!selectedRoom) return;
if (sessionMode === 'visitor') {
showToast('El modo visitante no puede modificar participantes ni permisos de salas.', 'warning');
return;
}
if (provider.state !== 'connected') {
showToast(
`${provider.name} no está conectado. Vincula primero el proveedor en "Conecta tus inteligencias".`,
'warning'
);
return;
}
const exists = selectedRoom.participants.some((p) => p.name === provider.name);
if (exists) {
showToast(`${provider.name} ya forma parte de esta conversación.`);
return;
}
const newParticipant: RoomParticipant = {
id: `ai-${Date.now()}`,
name: provider.name,
kind: 'ai',
provider: provider.vendor,
role: 'agent_operator',
presence: 'online',
permissions: provider.grantedScopes.length ? provider.grantedScopes : ['room.messages.read_mentioned']
};
setRooms((prev) =>
prev.map((r) =>
r.id === selectedRoom.id
? {
...r,
kind: 'group',
participants: [...r.participants, newParticipant],
subtitle: `Grupo mixto · ${r.participants.length + 1} participantes`
}
: r
)
);
const sysMsg: ChatMessage = {
id: `sys-${Date.now()}`,
roomId: selectedRoom.id,
senderId: 'system',
senderName: 'Control de Sala IA.app',
senderKind: 'system',
text: `Se integró a "${provider.name}" en la conversación con permisos acotados (${newParticipant.permissions.join(
', '
)}).`,
timestamp: 'Ahora',
dateGroup: 'AUDITORÍA DE SALA',
status: 'delivered',
reactions: {}
};
setMessagesByRoom((prev) => ({
...prev,
[selectedRoom.id]: [...(prev[selectedRoom.id] || []), sysMsg]
}));
setActivities((prev) => [
{
id: `ev-${Date.now()}`,
type: 'agent',
title: `Agente invitado a ${selectedRoom.title}`,
detail: `${provider.name} fue autorizado por ${currentUser.displayName}.`,
timestamp: 'Ahora',
dateLabel: 'HOY',
read: false,
actor: currentUser.displayName,
authRef: newParticipant.permissions[0]
},
...prev
]);
setActiveAttachmentSheet(null);
showToast(`${provider.name} añadido a la conversación con permisos auditados.`, 'success');
};
const handleCreateRoom = (e: React.FormEvent) => {
e.preventDefault();
if (sessionMode === 'visitor') {
showToast('Inicia sesión en Modo Identificado para crear nuevas salas o grupos.', 'warning');
return;
}
const title = newRoomTitle.trim() || (newRoomModal === 'group' ? 'Nuevo Grupo Mixto' : 'Nueva Conversación');
const newId = `room-${Date.now()}`;
const participants: RoomParticipant[] = [
{
id: currentUser.id,
name: currentUser.displayName,
kind: 'human',
role: 'owner',
iaAppNumber: currentUser.iaAppNumber,
presence: 'online',
permissions: ['admin.all']
}
];
if (newRoomModal === 'group') {
newGroupHumans.forEach((h, idx) => {
participants.push({
id: `h-${idx}-${Date.now()}`,
name: h,
kind: 'human',
role: 'member',
presence: 'online',
permissions: ['messages.send']
});
});
newGroupAgents.forEach((a, idx) => {
participants.push({
id: `a-${idx}-${Date.now()}`,
name: a,
kind: 'ai',
provider: 'Autorizado en IA.app',
role: 'agent_operator',
presence: 'online',
permissions: ['room.messages.read_mentioned']
});
});
}
const created: ConversationRoom = {
id: newId,
title,
subtitle:
newRoomModal === 'group'
? `Grupo mixto · ${participants.filter((p) => p.kind === 'human').length} humanos, ${
participants.filter((p) => p.kind === 'ai').length
} IAs`
: 'Conversación directa · Preparada para backend',
kind: newRoomModal === 'group' ? 'group' : 'human',
avatarLabel: title.slice(0, 2).toUpperCase(),
lastMessage: 'Sala creada en cascarón funcional. Lista para sincronizar con MessagingProvider.',
lastTime: 'Ahora',
unreadCount: 0,
online: true,
pinned: false,
muted: false,
archived: false,
isFixture: false,
participants
};
setRooms((prev) => [created, ...prev]);
setMessagesByRoom((prev) => ({
...prev,
[newId]: [
{
id: `m-init-${Date.now()}`,
roomId: newId,
senderId: 'system',
senderName: 'IA.app CHAT',
senderKind: 'system',
text: `Sala "${title}" inicializada con ${participants.length} participante(s). Los permisos de agentes están activos por mención.`,
timestamp: 'Ahora',
dateGroup: 'NUEVA SALA',
status: 'pending_backend',
reactions: {}
}
]
}));
setSelectedRoomId(newId);
setNewRoomModal(null);
setNewRoomTitle('');
setMobileChatOpen(true);
showToast(`Sala "${title}" creada.`, 'success');
};
const openProviderWizard = (prov: IntelligenceProviderItem) => {
setWizardProvider(prov);
setWizardStep(1);
setWizardSelectedScopes(
prov.grantedScopes.length
? prov.grantedScopes
: ['room.messages.read_mentioned', 'room.messages.reply', 'mcp.tools.invoke_approved']
);
setConnectionCenterOpen(true);
};
const completeProviderAuthorization = () => {
if (!wizardProvider) return;
if (sessionMode === 'visitor') {
showToast('Modo Visitante: identifícate con tu cuenta IA.app para autorizar proveedores.', 'warning');
return;
}
setProviders((prev) =>
prev.map((p) =>
p.id === wizardProvider.id
? {
...p,
state: 'connected',
grantedScopes: wizardSelectedScopes,
lastActivity: 'Recién autorizado vía adaptador de servidor'
}
: p
)
);
setActivities((prev) => [
{
id: `ev-auth-${Date.now()}`,
type: 'auth',
title: `Proveedor vinculado: ${wizardProvider.name}`,
detail: `Se autorizaron ${wizardSelectedScopes.length} alcances en PermissionsProvider.`,
timestamp: 'Ahora',
dateLabel: 'HOY',
read: false,
actor: currentUser.displayName,
authRef: wizardSelectedScopes.join(', ')
},
...prev
]);
setWizardStep(5);
showToast(`${wizardProvider.name} vinculado con permisos acotados.`, 'success');
};
const handleDisconnectProvider = (provId: string) => {
if (sessionMode === 'visitor') {
showToast('El modo visitante no puede revocar conexiones.', 'warning');
return;
}
setProviders((prev) =>
prev.map((p) =>
p.id === provId
? { ...p, state: 'available', grantedScopes: [], lastActivity: 'Permisos revocados por el usuario' }
: p
)
);
showToast('Conexión desconectada y permisos revocados.', 'neutral');
};
if (showSplash) {
return (
<div
onClick={() => setShowSplash(false)}
role="button"
tabIndex={0}
onKeyDown={(e) => {
if (e.key === 'Enter' || e.key === ' ') setShowSplash(false);
}}
aria-label="Pantalla de bienvenida de IA.app CHAT. Toca para comenzar."
style={{ backgroundColor: '#000000', color: '#F5F5F2' }}
className="fixed inset-0 z-50 flex flex-col items-center justify-between select-none cursor-pointer px-6 py-14 transition-opacity duration-300"
>
<div className="h-6" />

<div className="flex flex-col items-center justify-center text-center">
<svg
width="22"
height="19"
viewBox="0 0 24 20"
fill="none"
xmlns="http://www.w3.org/2000/svg"
className="mb-3.5 opacity-95"
aria-hidden="true"
>
<path
d="M12 19L1.5 1.5H22.5L12 19Z"
stroke="#F5F5F2"
strokeWidth="1.5"
strokeLinejoin="round"
/>
</svg>
<span
style={{ color: '#F5F5F2', letterSpacing: '-0.03em' }}
className="text-xl font-medium tracking-tight leading-none"
>
IA.app
</span>
<span
style={{ color: '#8E8E93', letterSpacing: '0.42em' }}
className="mt-2 text-[9px] font-normal uppercase pl-1"
>
CHAT
</span>
</div>

<div className="flex flex-col items-center gap-2">
<span
style={{ color: '#8E8E93', letterSpacing: '0.24em' }}
className="text-[10px] uppercase font-normal transition-opacity hover:opacity-100 opacity-75"
>
TOCA PARA COMENZAR
</span>
</div>
</div>
);
}
const bgPrimary = profileTheme === 'pure-black' ? '#000000' : '#0A0A0C';
return (
<div
style={{ backgroundColor: bgPrimary, color: '#F5F5F2', fontFamily: 'Inter, system-ui, sans-serif' }}
className="min-h-screen w-full flex flex-col overflow-x-hidden"
>

<div
style={{ backgroundColor: '#101012', borderBottom: '1px solid #242426' }}
className="w-full px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]"
>
<div className="flex items-center gap-2 flex-wrap">
<button
type="button"
onClick={() => setShowSplash(true)}
style={{ borderColor: '#242426', color: '#8E8E93' }}
className="px-2 py-0.5 rounded border hover:text-white transition-colors flex items-center gap-1"
title="Ver pantalla de bienvenida minimalista (#000000)"
>
<span>▽</span>
<span>Portada</span>
</button>

<div
style={{ backgroundColor: '#000000', border: '1px solid #242426' }}
className="inline-flex rounded p-0.5"
>
<button
type="button"
onClick={() => {
setSessionMode('visitor');
setSurface('user_app');
showToast('Modo Visitante activo: exploración libre sin contraseña ni acceso privado.');
}}
style={{
backgroundColor: sessionMode === 'visitor' ? '#242426' : 'transparent',
color: sessionMode === 'visitor' ? '#F5F5F2' : '#8E8E93'
}}
className="px-2 py-0.5 rounded text-[11px] transition-colors"
>
Modo Visitante
</button>
<button
type="button"
onClick={() => {
setSessionMode('identified');
showToast('Modo Identificado activo: sesión Better Auth/OAuth conectada (IA-0001-0001).', 'success');
}}
style={{
backgroundColor: sessionMode === 'identified' ? '#F5F5F2' : 'transparent',
color: sessionMode === 'identified' ? '#000000' : '#8E8E93'
}}
className="px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
>
Modo Identificado
</button>
</div>

<select
aria-label="Estado de sistema"
value={systemState}
onChange={(e) => setSystemState(e.target.value as SystemState)}
style={{ backgroundColor: '#000000', borderColor: '#242426', color: '#F5F5F2' }}
className="px-2 py-0.5 rounded border text-[11px]"
>
<option value="ready">Estado: Operativo</option>
<option value="loading">Estado: Cargando</option>
<option value="offline">Estado: Sin conexión</option>
<option value="error">Estado: Error de red</option>
</select>
</div>
<div className="flex items-center gap-2 flex-wrap">

<div
style={{ backgroundColor: '#000000', border: '1px solid #242426' }}
className="inline-flex rounded p-0.5"
>
<button
type="button"
onClick={() => setViewportMode('responsive')}
style={{
backgroundColor: viewportMode === 'responsive' ? '#242426' : 'transparent',
color: viewportMode === 'responsive' ? '#F5F5F2' : '#8E8E93'
}}
className="px-2 py-0.5 rounded flex items-center gap-1"
>
<Monitor className="w-3 h-3" />
<span>Escritorio / Fluido</span>
</button>
<button
type="button"
onClick={() => setViewportMode('mobile_390')}
style={{
backgroundColor: viewportMode === 'mobile_390' ? '#242426' : 'transparent',
color: viewportMode === 'mobile_390' ? '#F5F5F2' : '#8E8E93'
}}
className="px-2 py-0.5 rounded flex items-center gap-1"
>
<Smartphone className="w-3 h-3" />
<span>390×844</span>
</button>
</div>

<button
type="button"
onClick={() => {
if (surface === 'admin_panel') {
setSurface('user_app');
} else {
if (sessionMode === 'visitor') {
showToast(
'Permisos insuficientes: el panel administrativo (/admin) está restringido en Modo Visitante.',
'warning'
);
return;
}
setSurface('admin_panel');
}
}}
style={{
backgroundColor: surface === 'admin_panel' ? '#F5F5F2' : '#000000',
color: surface === 'admin_panel' ? '#000000' : '#F5F5F2',
borderColor: '#242426'
}}
className="px-2.5 py-0.5 rounded border font-medium flex items-center gap-1 transition-colors"
>
<Shield className="w-3 h-3" />
<span>{surface === 'admin_panel' ? 'Volver a IA.app CHAT' : 'Ruta /admin (Separada)'}</span>
</button>
</div>
</div>

{systemState !== 'ready' && (
<div
style={{ backgroundColor: '#101012', borderBottom: '1px solid #242426' }}
className="px-4 py-2 flex items-center justify-between text-xs"
>
<div className="flex items-center gap-2">
{systemState === 'loading' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#8E8E93]" />}
{systemState === 'offline' && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
{systemState === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
<span>
{systemState === 'loading' && 'Sincronizando adaptadores con el backend de IA.app...'}
{systemState === 'offline' &&
'Sin conexión de red: operando con caché local de lectura. El envío permanece en espera.'}
{systemState === 'error' &&
'Error de comunicación con el servicio remoto: verifica la salud de integraciones o reintenta.'}
</span>
</div>
<button
type="button"
onClick={() => setSystemState('ready')}
style={{ borderColor: '#242426' }}
className="px-2 py-0.5 rounded border text-[11px] hover:bg-[#242426]"
>
Restablecer
</button>
</div>
)}

{toast && (
<div
style={{
backgroundColor: '#101012',
borderColor:
toast.tone === 'success' ? '#22C55E' : toast.tone === 'warning' ? '#F59E0B' : '#242426',
color: '#F5F5F2'
}}
className="fixed bottom-16 right-4 z-50 max-w-sm px-3.5 py-2.5 rounded-lg border shadow-2xl flex items-center gap-2.5 text-xs"
>
<span
style={{
backgroundColor:
toast.tone === 'success' ? '#22C55E' : toast.tone === 'warning' ? '#F59E0B' : '#F5F5F2'
}}
className="w-2 h-2 rounded-full shrink-0"
/>
<span className="leading-relaxed">{toast.text}</span>
<button
type="button"
onClick={() => setToast(null)}
aria-label="Cerrar notificación"
className="text-[#8E8E93] hover:text-white ml-1"
>
<X className="w-3.5 h-3.5" />
</button>
</div>
)}

{surface === 'admin_panel' ? (
<div className="flex-1 flex flex-col md:flex-row min-h-0">
<aside
style={{ backgroundColor: '#000000', borderRight: '1px solid #242426' }}
className="w-full md:w-64 shrink-0 p-4 flex flex-col justify-between"
>
<div>
<div className="flex items-center justify-between pb-4 mb-4 border-b border-[#242426]">
<div className="flex items-center gap-2">
<span className="text-sm font-semibold tracking-tight">▽ IA.app</span>
<span
style={{ backgroundColor: '#101012', borderColor: '#242426', color: '#F5F5F2' }}
className="text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider"
>
ADMIN
</span>
</div>
<span className="text-[10px] text-[#22C55E] flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
RBAC Servidor
</span>
</div>
<nav aria-label="Navegación administrativa" className="space-y-1">
{[
{ id: 'overview', label: 'Salud de Integraciones', icon: Activity },
{ id: 'users', label: 'Usuarios e Identidad', icon: Users },
{ id: 'orgs', label: 'Organizaciones', icon: Building2 },
{ id: 'agents', label: 'Agentes y Proveedores', icon: Bot },
{ id: 'mcp', label: 'Servidores MCP y Skills', icon: Server },
{ id: 'roles', label: 'Roles y Permisos', icon: Key },
{ id: 'audit', label: 'Auditoría Técnica', icon: Terminal },
{ id: 'contracts', label: 'Contratos y Entregables', icon: FileText }
].map((item) => {
const Icon = item.icon;
const active = adminSection === item.id;
return (
<button
key={item.id}
type="button"
onClick={() => setAdminSection(item.id as typeof adminSection)}
style={{
backgroundColor: active ? '#101012' : 'transparent',
color: active ? '#F5F5F2' : '#8E8E93',
borderColor: active ? '#242426' : 'transparent'
}}
className="w-full px-3 py-2 rounded-md border text-left text-xs flex items-center justify-between transition-colors"
>
<span className="flex items-center gap-2.5">
<Icon className="w-3.5 h-3.5" />
<span>{item.label}</span>
</span>
<ChevronRight className="w-3 h-3 opacity-60" />
</button>
);
})}
</nav>
</div>
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="mt-6 p-3 rounded-lg border text-[11px] text-[#8E8E93] space-y-1"
>
<div className="text-[#F5F5F2] font-medium">Aislamiento Administrativo</div>
<p>
Esta ruta (`/admin`) está separada de la experiencia de mensajería y requiere validación de rol en
`PermissionsProvider` en backend.
</p>
</div>
</aside>

<main className="flex-1 p-5 md:p-8 overflow-y-auto space-y-6">
{adminSection === 'overview' && (
<div className="space-y-6 max-w-5xl">
<div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242426] pb-4">
<div>
<h1 className="text-lg font-semibold tracking-tight">
Panel Administrativo · Salud de Integraciones y Estado Real
</h1>
<p className="text-xs text-[#8E8E93] mt-0.5">
Monitoreo de pasarelas, adaptadores desacoplados y estado real vs pendiente (Secciones 16, 17 y 19).
</p>
</div>
<span
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="px-3 py-1 rounded border text-xs"
>
Dominio objetivo: <strong>https://iaapp.live</strong>
</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
{[
{
label: 'Identidad (Better Auth / OAuth)',
value: 'Adaptador Listo',
sub: '/api/auth · Sin contraseñas paralelas'
},
{
label: 'Pasarela MCP y VFORGE',
value: '2 Servidores',
sub: 'Buzón pull y auditoría por sala'
},
{
label: 'Proveedores Conectados',
value: `${providers.filter((p) => p.state === 'connected').length} de ${providers.length}`,
sub: 'Distinción estricta de estados'
},
{
label: 'Exposición Matrix / FluffyChat',
value: '0% Expuesto',
sub: 'Eliminado de la experiencia de usuario'
}
].map((card, i) => (
<div
key={i}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-lg border space-y-1.5"
>
<div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
<span>{card.label}</span>
<span className="w-2 h-2 rounded-full bg-[#22C55E]" />
</div>
<div className="text-base font-semibold">{card.value}</div>
<div className="text-[11px] text-[#8E8E93]">{card.sub}</div>
</div>
))}
</div>

<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="rounded-lg border overflow-hidden"
>
<div className="px-4 py-3 border-b border-[#242426] flex items-center justify-between">
<span className="text-xs font-semibold uppercase tracking-wider">
Entregable #17 · Matriz de Capacidades Reales (Cascarón) vs Pendientes (Backend)
</span>
<span className="text-[11px] text-[#8E8E93]">Transparencia técnica estricta</span>
</div>
<div className="divide-y divide-[#242426] text-xs">
{[
{
module: 'Portada #000000 + Entrada Inmediata (Visitante / Identificado)',
status: 'Completado en Frontend',
detail: 'Transición limpia, exploración sin login y bloqueo real de acciones privadas a visitantes.'
},
{
module: 'Bandeja, Vista de Conversación, Compositor y Grupos Mixtos',
status: 'Completado en Frontend',
detail: 'Búsqueda, filtros, respuestas, reacciones, selección, adjuntos e invitación auditada de IAs.'
},
{
module: 'Directorio de Inteligencias + Asistente "Conecta tus inteligencias"',
status: 'Completado en Frontend',
detail: 'Flujo de 6 pasos con alcances explícitos y revocación sin pedir contraseñas de terceros.'
},
{
module: 'Identidad Persistente y Asignación de Número IA.app',
status: 'Adaptador Listo · Backend Existente',
detail: 'Conecta con /api/auth y /api/backend de github.com/turbillon50/IA (Better Auth).'
},
{
module: 'Transporte de Mensajería en Tiempo Real y Persistencia',
status: 'Interfaz MessagingProvider Lista',
detail: 'Los mensajes nuevos se marcan como "Pendiente de backend" hasta enlazar el endpoint productivo.'
},
{
module: 'Ejecución de Herramientas VFORGE y Buzón MCP Pull',
status: 'Interfaz MCPProvider Lista',
detail: 'Conecta con /mcp y /api/backend/mcp sin exponer llaves privadas en el navegador.'
}
].map((row, idx) => (
<div key={idx} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
<div>
<div className="font-medium text-[#F5F5F2]">{row.module}</div>
<div className="text-[11px] text-[#8E8E93] mt-0.5">{row.detail}</div>
</div>
<span
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="px-2.5 py-1 rounded border text-[11px] shrink-0 self-start md:self-center"
>
{row.status}
</span>
</div>
))}
</div>
</div>
</div>
)}
{adminSection === 'users' && (
<div className="space-y-4 max-w-4xl">
<h2 className="text-base font-semibold">Usuarios e Identidades IA.app</h2>
<p className="text-xs text-[#8E8E93]">
Los números únicos IA.app son emitidos exclusivamente por el servicio de identidad en servidor.
</p>
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="rounded-lg border divide-y divide-[#242426] text-xs"
>
{contacts.map((u) => (
<div key={u.id} className="p-3.5 flex items-center justify-between">
<div className="flex items-center gap-3">
<div
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="w-8 h-8 rounded-full border flex items-center justify-center font-medium"
>
{u.avatarLabel}
</div>
<div>
<div className="font-medium">{u.name}</div>
<div className="text-[11px] text-[#8E8E93]">{u.iaAppNumber}</div>
</div>
</div>
<span className="text-[11px] px-2 py-0.5 rounded bg-black border border-[#242426]">
{u.organization || 'IA.app'}
</span>
</div>
))}
</div>
</div>
)}
{adminSection === 'orgs' && (
<div className="space-y-4 max-w-4xl">
<h2 className="text-base font-semibold">Organizaciones y Espacios</h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{[
{
name: 'VFORGE / Casa Matriz',
members: '4 miembros · 3 agentes autorizados',
policy: 'Aprobación explícita de herramientas MCP'
},
{
name: 'IA.app Core Product',
members: '6 miembros · 2 agentes autorizados',
policy: 'Acceso a salas mixtas por mención'
}
].map((org, idx) => (
<div
key={idx}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-lg border space-y-1.5"
>
<div className="text-sm font-semibold">{org.name}</div>
<div className="text-xs text-[#8E8E93]">{org.members}</div>
<div className="text-[11px] text-[#22C55E] pt-1">{org.policy}</div>
</div>
))}
</div>
</div>
)}
{(adminSection === 'agents' || adminSection === 'providers') && (
<div className="space-y-4 max-w-4xl">
<h2 className="text-base font-semibold">Catálogo de Proveedores y Estado de Conexión</h2>
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="rounded-lg border divide-y divide-[#242426] text-xs"
>
{providers.map((p) => (
<div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
<div>
<div className="font-medium flex items-center gap-2">
<span>{p.logoSymbol}</span>
<span>{p.name}</span>
</div>
<div className="text-[11px] text-[#8E8E93] mt-0.5">
Contrato: <code>{p.endpointContract}</code>
</div>
</div>
<div className="flex items-center gap-2">
<span
style={{
borderColor: '#242426',
color:
p.state === 'connected'
? '#22C55E'
: p.state === 'pending_config'
? '#F59E0B'
: '#8E8E93'
}}
className="px-2.5 py-1 rounded border bg-black text-[11px]"
>
{p.state === 'connected'
? 'Conectado'
: p.state === 'pending_config'
? 'Pendiente de configuración'
: 'Disponible'}
</span>
<button
type="button"
onClick={() => openProviderWizard(p)}
style={{ borderColor: '#242426' }}
className="px-2.5 py-1 rounded border hover:bg-[#242426]"
>
Configurar
</button>
</div>
</div>
))}
</div>
</div>
)}
{(adminSection === 'mcp' || adminSection === 'skills') && (
<div className="space-y-4 max-w-4xl">
<h2 className="text-base font-semibold">Servidores MCP, Herramientas y Skills Autorizadas</h2>
{mcpServers.map((srv) => (
<div
key={srv.id}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-lg border space-y-3 text-xs"
>
<div className="flex items-center justify-between">
<div>
<div className="font-semibold text-sm">{srv.name}</div>
<div className="text-[11px] text-[#8E8E93]">{srv.endpoint}</div>
</div>
<span className="text-[11px] text-[#22C55E] flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-[#22C55E]" />
Conectado
</span>
</div>
<div className="text-[11px] text-[#8E8E93]">
Skills activas: {srv.skills.map((s) => `[${s}]`).join(' ')}
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
{srv.tools.map((t) => (
<div
key={t.name}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="p-2.5 rounded border"
>
<div className="font-mono text-[11px] text-[#F5F5F2]">{t.name}</div>
<div className="text-[11px] text-[#8E8E93] mt-0.5">{t.description}</div>
<div className="text-[10px] text-[#8E8E93] mt-1">Alcance: {t.scope}</div>
</div>
))}
</div>
</div>
))}
</div>
)}
{(adminSection === 'roles' || adminSection === 'audit' || adminSection === 'contracts') && (
<div className="space-y-4 max-w-4xl">
<h2 className="text-base font-semibold">
Contratos de Adaptadores TypeScript y Auditoría de Acciones
</h2>
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-lg border font-mono text-[11px] text-[#F5F5F2] overflow-x-auto space-y-1"
>
<div className="text-[#8E8E93]">// Contratos desacoplados en /packages/contracts/providers.ts</div>
<div>export interface IdentityProvider &#123; getSession(); signInWithOAuth(); signOut(); &#125;</div>
<div>export interface MessagingProvider &#123; listRooms(); listMessages(roomId); sendMessage(); &#125;</div>
<div>export interface ContactsProvider &#123; listContacts(); requestContact(iaAppNumber); blockContact(); &#125;</div>
<div>export interface AgentsProvider &#123; listProviders(); inviteAgentToRoom(roomId, agentId, scopes); &#125;</div>
<div>export interface MCPProvider &#123; listServers(); invokeTool(server, tool, payload); &#125;</div>
<div>export interface NotificationProvider &#123; listEvents(); markRead(eventId); &#125;</div>
<div>export interface PermissionsProvider &#123; verifyScope(userId, scope); revokeProvider(providerId); &#125;</div>
</div>
</div>
)}
</main>
</div>
) : (

<div className="flex-1 flex justify-center items-stretch min-h-0">
<div
style={{
backgroundColor: bgPrimary,
borderColor: '#242426',
maxWidth: viewportMode === 'mobile_390' ? '390px' : '100%',
minHeight: viewportMode === 'mobile_390' ? '844px' : 'calc(100vh - 38px)'
}}
className={`w-full flex flex-col md:flex-row overflow-hidden ${
viewportMode === 'mobile_390' ? 'my-4 rounded-2xl border shadow-2xl' : ''
}`}
>

{viewportMode !== 'mobile_390' && (
<nav
aria-label="Navegación principal escritorio"
style={{ backgroundColor: '#000000', borderRight: '1px solid #242426' }}
className="hidden md:flex flex-col items-center justify-between w-16 py-4 shrink-0"
>
<div className="flex flex-col items-center gap-5">
<button
type="button"
onClick={() => setShowSplash(true)}
className="flex flex-col items-center group"
title="IA.app CHAT"
>
<span className="text-base font-semibold leading-none">▽</span>
<span className="text-[9px] tracking-widest text-[#8E8E93] mt-1">IA.app</span>
</button>
<div className="flex flex-col items-center gap-2">
{[
{ id: 'chats', label: 'Chats', icon: MessageSquare, badge: unreadRoomsCount },
{ id: 'contacts', label: 'Contactos', icon: Users, badge: 0 },
{ id: 'agents', label: 'Agentes', icon: Bot, badge: 0 },
{ id: 'activity', label: 'Actividad', icon: Bell, badge: unreadActivitiesCount },
{ id: 'profile', label: 'Perfil', icon: User, badge: 0 }
].map((item) => {
const Icon = item.icon;
const active = activeTab === item.id;
return (
<button
key={item.id}
type="button"
onClick={() => {
setActiveTab(item.id as typeof activeTab);
}}
style={{
backgroundColor: active ? '#101012' : 'transparent',
color: active ? '#F5F5F2' : '#8E8E93',
borderColor: active ? '#242426' : 'transparent'
}}
className="relative w-12 h-12 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors hover:text-white"
>
<Icon className="w-4 h-4" />
<span className="text-[9px]">{item.label}</span>
{item.badge > 0 && (
<span
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="absolute top-1 right-1.5 text-[9px] font-semibold px-1 rounded-full leading-tight"
>
{item.badge}
</span>
)}
</button>
);
})}
</div>
</div>
<div className="flex flex-col items-center gap-3">
<button
type="button"
onClick={() => setConnectionCenterOpen(true)}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="w-10 h-10 rounded-xl border flex items-center justify-center text-[#F5F5F2] hover:bg-[#242426]"
title="Conecta tus inteligencias"
>
<Sparkles className="w-4 h-4" />
</button>
</div>
</nav>
)}

<header
style={{ backgroundColor: '#000000', borderBottom: '1px solid #242426' }}
className={`${
viewportMode === 'mobile_390' ? 'flex' : 'flex md:hidden'
} items-center justify-between px-3.5 py-2.5 shrink-0`}
>
<div className="flex items-center gap-2">
{mobileChatOpen && activeTab === 'chats' ? (
<button
type="button"
onClick={() => setMobileChatOpen(false)}
className="p-1 -ml-1 text-[#F5F5F2] flex items-center gap-1"
aria-label="Volver a bandeja"
>
<ChevronLeft className="w-4 h-4" />
<span className="text-xs font-medium">Bandeja</span>
</button>
) : (
<>
<span className="text-xs font-semibold tracking-tight">▽ IA.app</span>
<span className="text-[#242426]">·</span>
<span className="text-xs text-[#8E8E93] capitalize">
{activeTab === 'chats'
? 'Chats'
: activeTab === 'contacts'
? 'Contactos'
: activeTab === 'agents'
? 'Agentes'
: activeTab === 'activity'
? 'Actividad'
: 'Perfil'}
</span>
</>
)}
</div>
<div className="flex items-center gap-1.5">
<button
type="button"
onClick={() => setConnectionCenterOpen(true)}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="px-2 py-1 rounded border text-[10px] flex items-center gap-1"
>
<Sparkles className="w-3 h-3" />
<span>Conectar IA</span>
</button>
<button
type="button"
onClick={() => setNewRoomModal('group')}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-1.5 rounded border text-[#F5F5F2]"
aria-label="Nueva sala o grupo"
>
<Plus className="w-3.5 h-3.5" />
</button>
</div>
</header>

{activeTab === 'chats' && (
<div className="flex-1 flex min-h-0 overflow-hidden">

<aside
style={{ backgroundColor: '#000000', borderRight: '1px solid #242426' }}
className={`${
viewportMode === 'mobile_390'
? mobileChatOpen
? 'hidden'
: 'flex w-full'
: mobileChatOpen
? 'hidden md:flex md:w-80 lg:w-96'
: 'flex w-full md:w-80 lg:w-96'
} flex-col shrink-0 min-h-0`}
>
<div className="p-3.5 space-y-2.5 border-b border-[#242426]">
<div className="flex items-center justify-between">
<div>
<h1 className="text-sm font-semibold tracking-tight">Conversaciones</h1>
<p className="text-[10px] text-[#8E8E93]">
{sessionMode === 'visitor'
? 'Modo Visitante · Exploración demostrativa'
: `Identificado · ${currentUser.iaAppNumber}`}
</p>
</div>
<div className="flex items-center gap-1">
<button
type="button"
onClick={() => setNewRoomModal('direct')}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="px-2 py-1 rounded border text-[10px] hover:bg-[#242426]"
title="Nueva conversación directa"
>
+ Chat
</button>
<button
type="button"
onClick={() => setNewRoomModal('group')}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-2 py-1 rounded text-[10px] font-medium"
title="Nuevo grupo mixto (Humanos + IAs)"
>
+ Grupo Mixto
</button>
</div>
</div>

<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border"
>
<Search className="w-3.5 h-3.5 text-[#8E8E93] shrink-0" />
<input
type="search"
value={roomSearch}
onChange={(e) => setRoomSearch(e.target.value)}
placeholder="Buscar persona, agente o grupo..."
aria-label="Buscar conversación"
className="w-full bg-transparent text-xs text-[#F5F5F2] placeholder-[#8E8E93] focus:outline-none"
/>
{roomSearch && (
<button
type="button"
onClick={() => setRoomSearch('')}
className="text-[#8E8E93] hover:text-white"
>
<X className="w-3 h-3" />
</button>
)}
</div>

<div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
{[
{ id: 'all', label: 'Todos' },
{ id: 'human', label: 'Personas' },
{ id: 'ai', label: 'Inteligencias' },
{ id: 'group', label: 'Grupos' },
{ id: 'archived', label: 'Archivo' }
].map((f) => {
const active = roomFilter === f.id;
return (
<button
key={f.id}
type="button"
onClick={() => setRoomFilter(f.id as typeof roomFilter)}
style={{
backgroundColor: active ? '#F5F5F2' : '#101012',
color: active ? '#000000' : '#8E8E93',
borderColor: '#242426'
}}
className="px-2.5 py-1 rounded-full border text-[10px] font-medium shrink-0 transition-colors"
>
{f.label}
</button>
);
})}
<button
type="button"
onClick={() => setForceEmptyRooms((v) => !v)}
style={{ borderColor: '#242426', color: '#8E8E93' }}
className="px-2 py-1 rounded-full border text-[10px] shrink-0 hover:text-white"
title="Alternar vista de estado vacío"
>
{forceEmptyRooms ? 'Ver salas' : 'Probar vacío'}
</button>
</div>
</div>

<div className="flex-1 overflow-y-auto divide-y divide-[#242426]">
{filteredRooms.length === 0 ? (
<div className="p-8 text-center space-y-3">
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="w-10 h-10 rounded-full border mx-auto flex items-center justify-center text-[#8E8E93]"
>
<MessageSquare className="w-4 h-4" />
</div>
<div className="space-y-1">
<div className="text-xs font-medium text-[#F5F5F2]">
No hay conversaciones en esta vista
</div>
<p className="text-[11px] text-[#8E8E93] leading-relaxed">
Inicia una conversación con una persona, invita a una inteligencia autorizada o crea un
grupo mixto.
</p>
</div>
<div className="flex justify-center gap-2 pt-1">
{forceEmptyRooms && (
<button
type="button"
onClick={() => setForceEmptyRooms(false)}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="px-3 py-1.5 rounded border text-xs"
>
Restaurar salas de demostración
</button>
)}
<button
type="button"
onClick={() => setNewRoomModal('group')}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-3 py-1.5 rounded text-xs font-medium"
>
Crear grupo mixto
</button>
</div>
</div>
) : (
filteredRooms.map((room) => {
const isSelected = selectedRoom?.id === room.id;
return (
<div
key={room.id}
style={{
backgroundColor: isSelected ? '#101012' : 'transparent'
}}
className="group relative px-3.5 py-3 hover:bg-[#101012] transition-colors flex items-start gap-3"
>
<button
type="button"
onClick={() => handleSelectRoom(room.id)}
className="flex-1 flex items-start gap-3 text-left min-w-0"
>
<div className="relative shrink-0">
<div
style={{
backgroundColor: room.kind === 'ai' ? '#101012' : '#000000',
borderColor: '#242426'
}}
className="w-10 h-10 rounded-full border flex items-center justify-center text-xs font-semibold tracking-tight"
>
{room.avatarLabel}
</div>
{room.online && (
<span
style={{ backgroundColor: '#22C55E', borderColor: '#000000' }}
className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
title="Disponible"
/>
)}
</div>
<div className="flex-1 min-w-0">
<div className="flex items-center justify-between gap-1">
<div className="flex items-center gap-1.5 min-w-0">
<span className="text-xs font-medium text-[#F5F5F2] truncate">
{room.title}
</span>
<span
style={{ backgroundColor: '#000000', borderColor: '#242426', color: '#8E8E93' }}
className="text-[9px] px-1.5 py-0.2 rounded border uppercase shrink-0"
>
{room.kind === 'group'
? 'Grupo'
: room.kind === 'ai'
? 'IA'
: 'Persona'}
</span>
</div>
<span className="text-[10px] text-[#8E8E93] shrink-0">{room.lastTime}</span>
</div>
<div className="text-[11px] text-[#8E8E93] truncate mt-0.5">
{room.lastMessage}
</div>
<div className="flex items-center justify-between mt-1">
<div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
{room.pinned && <Pin className="w-2.5 h-2.5 text-[#F5F5F2]" />}
{room.muted && <VolumeX className="w-2.5 h-2.5" />}
{room.isFixture && (
<span className="text-[9px] text-[#8E8E93]">· Demo etiquetada</span>
)}
</div>
{room.unreadCount > 0 && (
<span
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold"
>
{room.unreadCount}
</span>
)}
</div>
</div>
</button>

<div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-[#101012] pl-1">
<button
type="button"
onClick={() => handleTogglePinRoom(room.id)}
className="p-1 rounded hover:bg-[#242426] text-[#8E8E93] hover:text-white"
title={room.pinned ? 'Desfijar' : 'Fijar conversación'}
>
<Pin className="w-3 h-3" />
</button>
<button
type="button"
onClick={() => handleToggleMuteRoom(room.id)}
className="p-1 rounded hover:bg-[#242426] text-[#8E8E93] hover:text-white"
title={room.muted ? 'Activar sonido' : 'Silenciar'}
>
<VolumeX className="w-3 h-3" />
</button>
<button
type="button"
onClick={() => handleToggleArchiveRoom(room.id)}
className="p-1 rounded hover:bg-[#242426] text-[#8E8E93] hover:text-white"
title={room.archived ? 'Desarchivar' : 'Archivar'}
>
<Archive className="w-3 h-3" />
</button>
{room.unreadCount > 0 && (
<button
type="button"
onClick={() => handleMarkRoomRead(room.id)}
className="p-1 rounded hover:bg-[#242426] text-[#8E8E93] hover:text-white"
title="Marcar como leído"
>
<Check className="w-3 h-3" />
</button>
)}
</div>
</div>
);
})
)}
</div>
</aside>

<main
style={{ backgroundColor: bgPrimary }}
className={`${
viewportMode === 'mobile_390'
? mobileChatOpen
? 'flex w-full'
: 'hidden'
: 'flex flex-1'
} flex-col min-w-0 min-h-0`}
>
{selectedRoom ? (
<>

<header
style={{ backgroundColor: '#000000', borderBottom: '1px solid #242426' }}
className="px-4 py-2.5 flex items-center justify-between gap-2 shrink-0"
>
<div className="flex items-center gap-3 min-w-0">
<button
type="button"
onClick={() => setContextDrawerOpen((v) => !v)}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="w-9 h-9 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0"
title="Ver perfil y permisos de la sala"
>
{selectedRoom.avatarLabel}
</button>
<div className="min-w-0">
<div className="flex items-center gap-2">
<h2 className="text-xs sm:text-sm font-semibold text-[#F5F5F2] truncate">
{selectedRoom.title}
</h2>
{selectedRoom.online && (
<span
style={{ backgroundColor: '#22C55E' }}
className="w-2 h-2 rounded-full shrink-0"
title="Participantes activos"
/>
)}
</div>
<p className="text-[11px] text-[#8E8E93] truncate">{selectedRoom.subtitle}</p>
</div>
</div>
<div className="flex items-center gap-1.5 shrink-0">
<button
type="button"
onClick={() => setInChatSearchOpen((v) => !v)}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-2 rounded-lg border text-[#8E8E93] hover:text-white"
title="Buscar dentro de la conversación"
>
<Search className="w-3.5 h-3.5" />
</button>
<button
type="button"
onClick={() => setActiveAttachmentSheet('invite_ai')}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 hover:bg-[#242426]"
title="Invitar una inteligencia artificial a esta conversación"
>
<Bot className="w-3.5 h-3.5" />
<span className="hidden sm:inline">Invitar IA</span>
</button>
<button
type="button"
onClick={() => setContextDrawerOpen((v) => !v)}
style={{
backgroundColor: contextDrawerOpen ? '#F5F5F2' : '#101012',
color: contextDrawerOpen ? '#000000' : '#F5F5F2',
borderColor: '#242426'
}}
className="px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center gap-1"
title="Opciones de grupo, participantes y permisos"
>
<Sliders className="w-3.5 h-3.5" />
<span className="hidden sm:inline">Info y Permisos</span>
</button>
</div>
</header>

{inChatSearchOpen && (
<div
style={{ backgroundColor: '#101012', borderBottom: '1px solid #242426' }}
className="px-4 py-2 flex items-center gap-2"
>
<Search className="w-3.5 h-3.5 text-[#8E8E93]" />
<input
type="search"
value={inChatSearchQuery}
onChange={(e) => setInChatSearchQuery(e.target.value)}
placeholder="Filtrar mensajes en esta conversación..."
className="flex-1 bg-transparent text-xs text-[#F5F5F2] placeholder-[#8E8E93] focus:outline-none"
/>
<button
type="button"
onClick={() => {
setInChatSearchQuery('');
setInChatSearchOpen(false);
}}
className="text-[11px] text-[#8E8E93] hover:text-white"
>
Cerrar
</button>
</div>
)}

{selectedMessageIds.length > 0 && (
<div
style={{ backgroundColor: '#101012', borderBottom: '1px solid #242426' }}
className="px-4 py-1.5 flex items-center justify-between text-xs"
>
<span>{selectedMessageIds.length} mensaje(s) seleccionado(s)</span>
<div className="flex items-center gap-2">
<button
type="button"
onClick={() => {
const texts = currentMessages
.filter((m) => selectedMessageIds.includes(m.id))
.map((m) => `${m.senderName}: ${m.text}`)
.join('\n');
handleCopyMessage(texts);
setSelectedMessageIds([]);
}}
className="px-2 py-0.5 rounded border border-[#242426] hover:bg-[#242426]"
>
Copiar selección
</button>
<button
type="button"
onClick={() => setSelectedMessageIds([])}
className="text-[#8E8E93] hover:text-white"
>
Cancelar
</button>
</div>
</div>
)}

<div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
{selectedRoom.kind === 'group' && (
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-[11px]"
>
<div className="flex items-center gap-2 flex-wrap">
<span className="text-[#8E8E93]">Participantes en sala:</span>
{selectedRoom.participants.map((p) => (
<span
key={p.id}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="px-2 py-0.5 rounded border inline-flex items-center gap-1"
>
<span>{p.name}</span>
<span className="text-[9px] text-[#8E8E93] uppercase">
· {p.kind === 'ai' ? 'IA' : 'Humano'}
</span>
</span>
))}
</div>
</div>
)}
{currentMessages.map((msg, idx) => {
const prevMsg = idx > 0 ? currentMessages[idx - 1] : null;
const showDateSeparator = !prevMsg || prevMsg.dateGroup !== msg.dateGroup;
const isGroupedWithPrev =
prevMsg &&
prevMsg.senderId === msg.senderId &&
prevMsg.dateGroup === msg.dateGroup;
const isOwn = msg.senderId === 'u-luis' && sessionMode === 'identified';
const isSelected = selectedMessageIds.includes(msg.id);
return (
<React.Fragment key={msg.id}>
{showDateSeparator && (
<div className="flex items-center justify-center my-3">
<span
style={{ backgroundColor: '#101012', borderColor: '#242426', color: '#8E8E93' }}
className="px-3 py-0.5 rounded-full border text-[10px] uppercase tracking-wider"
>
{msg.dateGroup}
</span>
</div>
)}
{msg.senderKind === 'system' ? (
<div className="flex justify-center">
<div
style={{ backgroundColor: '#101012', borderColor: '#242426', color: '#8E8E93' }}
className="max-w-md px-3 py-1.5 rounded-lg border text-[11px] text-center"
>
{msg.text}
</div>
</div>
) : (
<div
className={`flex flex-col ${
isOwn ? 'items-end' : 'items-start'
} ${isGroupedWithPrev ? 'mt-1' : 'mt-3'}`}
>
{!isGroupedWithPrev && (
<div className="flex items-center gap-1.5 mb-1 px-1">
<span className="text-[11px] font-medium text-[#F5F5F2]">
{msg.senderName}
</span>
{msg.senderKind === 'ai' && (
<span
style={{
backgroundColor: '#101012',
borderColor: '#242426',
color: '#F5F5F2'
}}
className="text-[9px] px-1.5 py-0.2 rounded border uppercase tracking-wider"
>
{msg.senderBadge || 'IA · AGENTE'}
</span>
)}
</div>
)}
<div
style={{
backgroundColor: isOwn ? '#F5F5F2' : '#101012',
color: isOwn ? '#000000' : '#F5F5F2',
borderColor: isSelected ? '#F5F5F2' : '#242426'
}}
className="group relative max-w-[85%] sm:max-w-[72%] rounded-2xl border px-3.5 py-2.5 text-xs leading-relaxed"
>
{msg.replyTo && (
<div
style={{
backgroundColor: isOwn ? '#E5E5E0' : '#000000',
borderLeft: '2px solid #8E8E93'
}}
className="mb-2 px-2.5 py-1 rounded text-[11px] opacity-90"
>
<div className="font-semibold">{msg.replyTo.senderName}</div>
<div className="truncate opacity-80">{msg.replyTo.text}</div>
</div>
)}
<p className="whitespace-pre-wrap break-words">{msg.text}</p>
{msg.agentAction && (
<div
style={{
backgroundColor: '#000000',
borderColor: '#242426',
color: '#F5F5F2'
}}
className="mt-2.5 p-2.5 rounded-xl border text-[11px] space-y-1"
>
<div className="flex items-center justify-between">
<span className="font-mono text-[10px] text-[#22C55E] flex items-center gap-1">
<Wrench className="w-3 h-3" />
<span>Acción ejecutada: {msg.agentAction.toolName}</span>
</span>
<span className="text-[10px] text-[#8E8E93]">
{msg.agentAction.timestamp}
</span>
</div>
<div className="text-[#F5F5F2]">{msg.agentAction.summary}</div>
<div className="text-[10px] text-[#8E8E93] pt-0.5 flex flex-wrap gap-2">
<span>Autorización: {msg.agentAction.authorizedBy}</span>
<span>·</span>
<span className="font-mono">{msg.agentAction.authScope}</span>
</div>
</div>
)}
<div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] opacity-75">
<div className="flex items-center gap-1">
{Object.entries(msg.reactions).map(([emoji, count]) => (
<button
key={emoji}
type="button"
onClick={() => handleReaction(msg.id, emoji)}
style={{
backgroundColor: isOwn ? '#E5E5E0' : '#000000',
borderColor: '#242426',
color: isOwn ? '#000000' : '#F5F5F2'
}}
className="px-1.5 py-0.2 rounded-full border text-[10px]"
>
{emoji} {count}
</button>
))}
</div>
<div className="flex items-center gap-1 ml-auto">
<span>{msg.timestamp}</span>
{msg.status === 'read' && <CheckCheck className="w-3 h-3" />}
{msg.status === 'delivered' && <Check className="w-3 h-3" />}
{msg.status === 'pending_backend' && (
<span
className="inline-flex items-center gap-0.5"
title="Registrado en UI · Pendiente de backend"
>
<Clock className="w-2.5 h-2.5" />
<span>Adaptador</span>
</span>
)}
</div>
</div>
<div
style={{ backgroundColor: '#101012', borderColor: '#242426', color: '#F5F5F2' }}
className="hidden group-hover:flex items-center gap-1 absolute -top-3 right-2 px-1.5 py-0.5 rounded-md border shadow-lg"
>
<button
type="button"
onClick={() => setReplyingTo(msg)}
className="p-1 hover:bg-[#242426] rounded"
title="Responder"
>
<Reply className="w-3 h-3" />
</button>
<button
type="button"
onClick={() => handleCopyMessage(msg.text)}
className="p-1 hover:bg-[#242426] rounded"
title="Copiar texto"
>
<Copy className="w-3 h-3" />
</button>
<button
type="button"
onClick={() => handleReaction(msg.id, '⚡')}
className="p-1 hover:bg-[#242426] rounded text-[10px]"
title="Reaccionar"
>
⚡
</button>
<button
type="button"
onClick={() => handleToggleSelectMessage(msg.id)}
className="p-1 hover:bg-[#242426] rounded text-[10px]"
title="Seleccionar mensaje"
>
✓
</button>
</div>
</div>
</div>
)}
</React.Fragment>
);
})}
</div>

{activeAttachmentSheet && (
<div
style={{ backgroundColor: '#101012', borderTop: '1px solid #242426' }}
className="px-4 py-3 space-y-2.5 text-xs"
>
<div className="flex items-center justify-between">
<span className="font-semibold">
{activeAttachmentSheet === 'attach' && 'Adjuntar archivo a la conversación'}
{activeAttachmentSheet === 'camera' && 'Captura de cámara'}
{activeAttachmentSheet === 'mic' && 'Nota de voz / Transcripción'}
{activeAttachmentSheet === 'mcp_tools' && 'Herramientas MCP autorizadas en esta sala'}
{activeAttachmentSheet === 'invite_ai' && 'Invitar una Inteligencia Artificial a la sala'}
</span>
<button
type="button"
onClick={() => setActiveAttachmentSheet(null)}
className="text-[#8E8E93] hover:text-white"
>
<X className="w-3.5 h-3.5" />
</button>
</div>
{activeAttachmentSheet === 'attach' && (
<div className="flex flex-wrap items-center justify-between gap-2">
<span className="text-[#8E8E93]">
El adaptador de subida de objetos requiere el endpoint de almacenamiento del backend.
</span>
<button
type="button"
onClick={() => {
setComposerText((prev) =>
prev ? `${prev} [Documento_Arquitectura.pdf]` : '[Documento_Arquitectura.pdf]'
);
setActiveAttachmentSheet(null);
showToast('Referencia de adjunto preparada en el compositor.');
}}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-3 py-1 rounded font-medium"
>
Insertar referencia de prueba
</button>
</div>
)}
{activeAttachmentSheet === 'camera' && (
<div className="flex flex-wrap items-center justify-between gap-2">
<span className="text-[#8E8E93]">
Captura visual lista en cliente; el almacenamiento multimedia se procesa al conectar el
servicio de medios.
</span>
<button
type="button"
onClick={() => {
setComposerText((prev) =>
prev ? `${prev} [Captura_Sala_IAapp.png]` : '[Captura_Sala_IAapp.png]'
);
setActiveAttachmentSheet(null);
showToast('Captura insertada en el borrador.');
}}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-3 py-1 rounded font-medium"
>
Adjuntar captura al borrador
</button>
</div>
)}
{activeAttachmentSheet === 'mic' && (
<div className="flex flex-wrap items-center justify-between gap-2">
<span className="text-[#8E8E93]">
El canal de audio requiere conexión activa al servicio de transcripción en servidor.
</span>
<button
type="button"
onClick={() => {
setComposerText((prev) =>
prev
? `${prev} [Nota de voz: revisar contratos de integración]`
: '[Nota de voz: revisar contratos de integración]'
);
setActiveAttachmentSheet(null);
showToast('Nota de voz transcrita en el compositor.');
}}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-3 py-1 rounded font-medium"
>
Insertar transcripción de prueba
</button>
</div>
)}
{activeAttachmentSheet === 'mcp_tools' && (
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
{mcpServers.flatMap((s) => s.tools).map((tool) => (
<button
key={tool.name}
type="button"
onClick={() => {
setComposerText(`@agente ejecutar ${tool.name} (${tool.scope})`);
setActiveAttachmentSheet(null);
showToast(`Herramienta ${tool.name} preparada en el compositor.`);
}}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="p-2.5 rounded border text-left hover:border-[#F5F5F2] transition-colors"
>
<div className="font-mono text-[11px] text-[#F5F5F2]">{tool.name}</div>
<div className="text-[10px] text-[#8E8E93]">{tool.description}</div>
</button>
))}
</div>
)}
{activeAttachmentSheet === 'invite_ai' && (
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
{providers.map((prov) => (
<div
key={prov.id}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="p-2.5 rounded border flex items-center justify-between gap-2"
>
<div>
<div className="font-medium flex items-center gap-1.5">
<span>{prov.logoSymbol}</span>
<span>{prov.name}</span>
</div>
<div className="text-[10px] text-[#8E8E93]">
{prov.state === 'connected'
? 'Conectado y listo'
: prov.state === 'pending_config'
? 'Pendiente de configuración'
: 'Disponible para vincular'}
</div>
</div>
{prov.state === 'connected' ? (
<button
type="button"
onClick={() => handleInviteAgentToRoom(prov)}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-2.5 py-1 rounded text-[11px] font-medium"
>
Invitar
</button>
) : (
<button
type="button"
onClick={() => openProviderWizard(prov)}
style={{ borderColor: '#242426' }}
className="px-2.5 py-1 rounded border text-[11px] text-[#8E8E93] hover:text-white"
>
Vincular
</button>
)}
</div>
))}
</div>
)}
</div>
)}

{replyingTo && (
<div
style={{ backgroundColor: '#101012', borderTop: '1px solid #242426' }}
className="px-4 py-2 flex items-center justify-between text-xs"
>
<div className="truncate">
<span className="text-[#8E8E93]">Respondiendo a </span>
<strong className="text-[#F5F5F2]">{replyingTo.senderName}: </strong>
<span className="text-[#8E8E93]">{replyingTo.text}</span>
</div>
<button
type="button"
onClick={() => setReplyingTo(null)}
className="text-[#8E8E93] hover:text-white ml-2"
>
<X className="w-3.5 h-3.5" />
</button>
</div>
)}

<form
onSubmit={handleSendMessage}
style={{ backgroundColor: '#000000', borderTop: '1px solid #242426' }}
className="px-3 py-2.5 flex items-end gap-1.5 shrink-0"
>
<button
type="button"
onClick={() =>
setActiveAttachmentSheet((cur) => (cur === 'attach' ? null : 'attach'))
}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-2 rounded-xl border text-[#8E8E93] hover:text-white shrink-0"
title="Adjuntar archivos"
>
<Paperclip className="w-4 h-4" />
</button>
<button
type="button"
onClick={() =>
setActiveAttachmentSheet((cur) => (cur === 'camera' ? null : 'camera'))
}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-2 rounded-xl border text-[#8E8E93] hover:text-white shrink-0 hidden sm:flex"
title="Cámara"
>
<Camera className="w-4 h-4" />
</button>
<button
type="button"
onClick={() =>
setActiveAttachmentSheet((cur) => (cur === 'mcp_tools' ? null : 'mcp_tools'))
}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-2 rounded-xl border text-[#8E8E93] hover:text-white shrink-0"
title="Acceso a herramientas MCP autorizadas"
>
<Wrench className="w-4 h-4" />
</button>
<button
type="button"
onClick={() =>
setActiveAttachmentSheet((cur) => (cur === 'invite_ai' ? null : 'invite_ai'))
}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-2 rounded-xl border text-[#8E8E93] hover:text-white shrink-0"
title="Invitar una inteligencia artificial"
>
<Bot className="w-4 h-4" />
</button>
<textarea
rows={1}
value={composerText}
onChange={(e) => setComposerText(e.target.value)}
onKeyDown={(e) => {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault();
handleSendMessage();
}
}}
placeholder={
sessionMode === 'visitor'
? 'Modo Visitante (solo lectura) — cambia a Modo Identificado para enviar...'
: 'Escribe un mensaje para personas o inteligencias...'
}
style={{ backgroundColor: '#101012', borderColor: '#242426', color: '#F5F5F2' }}
className="flex-1 resize-none rounded-xl border px-3 py-2 text-xs placeholder-[#8E8E93] focus:outline-none focus:border-[#F5F5F2] max-h-28"
/>
<button
type="button"
onClick={() => setActiveAttachmentSheet((cur) => (cur === 'mic' ? null : 'mic'))}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-2 rounded-xl border text-[#8E8E93] hover:text-white shrink-0"
title="Micrófono"
>
<Mic className="w-4 h-4" />
</button>
<button
type="submit"
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="p-2 rounded-xl font-medium shrink-0 hover:opacity-90 transition-opacity"
title="Enviar mensaje"
>
<Send className="w-4 h-4" />
</button>
</form>
</>
) : null}
</main>

{contextDrawerOpen && selectedRoom && (
<aside
style={{ backgroundColor: '#000000', borderLeft: '1px solid #242426' }}
className="w-full sm:w-80 shrink-0 p-4 overflow-y-auto space-y-5 text-xs"
>
<div className="flex items-center justify-between border-b border-[#242426] pb-3">
<span className="font-semibold">Información y Permisos de Sala</span>
<button
type="button"
onClick={() => setContextDrawerOpen(false)}
className="text-[#8E8E93] hover:text-white"
>
<X className="w-4 h-4" />
</button>
</div>
<div className="space-y-1">
<div className="text-sm font-semibold">{selectedRoom.title}</div>
<div className="text-[11px] text-[#8E8E93]">{selectedRoom.subtitle}</div>
</div>
<div className="grid grid-cols-2 gap-2">
<button
type="button"
onClick={() => handleToggleMuteRoom(selectedRoom.id)}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-2 rounded-lg border text-center hover:bg-[#242426]"
>
{selectedRoom.muted ? 'Activar notificaciones' : 'Silenciar sala'}
</button>
<button
type="button"
onClick={() => setActiveAttachmentSheet('invite_ai')}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-2 rounded-lg border text-center hover:bg-[#242426]"
>
+ Invitar Agente IA
</button>
</div>
<div className="space-y-2">
<div className="text-[11px] uppercase tracking-wider text-[#8E8E93]">
Participantes ({selectedRoom.participants.length})
</div>
<div className="space-y-2">
{selectedRoom.participants.map((part) => (
<div
key={part.id}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-2.5 rounded-lg border space-y-1.5"
>
<div className="flex items-center justify-between">
<span className="font-medium flex items-center gap-1.5">
<span>{part.name}</span>
<span
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="text-[9px] px-1.5 py-0.2 rounded border uppercase text-[#8E8E93]"
>
{part.kind === 'ai' ? 'Agente IA' : 'Humano'}
</span>
</span>
<span className="text-[10px] text-[#8E8E93]">{part.role}</span>
</div>
{part.provider && (
<div className="text-[10px] text-[#8E8E93]">Proveedor: {part.provider}</div>
)}
<div className="flex flex-wrap gap-1 pt-0.5">
{part.permissions.map((perm) => (
<span
key={perm}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="px-1.5 py-0.5 rounded border font-mono text-[9px] text-[#8E8E93]"
>
{perm}
</span>
))}
</div>
{part.id !== 'u-luis' && (
<div className="flex items-center gap-2 pt-1">
<button
type="button"
onClick={() => {
if (sessionMode === 'visitor') {
showToast('Modo Visitante: no puedes modificar permisos.', 'warning');
return;
}
showToast(`Permisos de ${part.name} actualizados en PermissionsProvider.`);
}}
className="text-[10px] text-[#8E8E93] hover:text-white underline"
>
Modificar permisos
</button>
<button
type="button"
onClick={() => {
if (sessionMode === 'visitor') {
showToast('Modo Visitante: acción no autorizada.', 'warning');
return;
}
setRooms((prev) =>
prev.map((r) =>
r.id === selectedRoom.id
? {
...r,
participants: r.participants.filter((x) => x.id !== part.id)
}
: r
)
);
showToast(`${part.name} fue retirado de la sala.`);
}}
className="text-[10px] text-red-400 hover:underline"
>
Expulsar
</button>
</div>
)}
</div>
))}
</div>
</div>
</aside>
)}
</div>
)}

{activeTab === 'contacts' && (
<div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
<div className="max-w-4xl mx-auto space-y-5">
<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242426] pb-4">
<div>
<h1 className="text-base font-semibold tracking-tight">Directorio de Personas</h1>
<p className="text-xs text-[#8E8E93]">
Cada identidad cuenta con un número único IA.app asignado por el backend de identidad.
</p>
</div>
<button
type="button"
onClick={() => {
if (sessionMode === 'visitor') {
showToast('Inicia sesión en Modo Identificado para enviar solicitudes de contacto.', 'warning');
return;
}
showToast('Solicitud de contacto registrada en ContactsProvider.', 'success');
}}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
>
<UserPlus className="w-3.5 h-3.5" />
<span>Solicitar contacto por número IA.app</span>
</button>
</div>
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="flex items-center gap-2 px-3 py-2 rounded-xl border"
>
<Search className="w-4 h-4 text-[#8E8E93]" />
<input
type="search"
value={contactSearch}
onChange={(e) => setContactSearch(e.target.value)}
placeholder="Buscar por nombre o número IA.app (ej. IA-0001-0104)..."
className="w-full bg-transparent text-xs text-[#F5F5F2] placeholder-[#8E8E93] focus:outline-none"
/>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
{filteredContacts.map((contact) => (
<div
key={contact.id}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-xl border flex flex-col justify-between gap-3"
>
<div className="flex items-start justify-between gap-3">
<div className="flex items-center gap-3">
<div className="relative">
<div
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="w-10 h-10 rounded-full border flex items-center justify-center text-xs font-semibold"
>
{contact.avatarLabel}
</div>
{contact.online && (
<span
style={{ backgroundColor: '#22C55E', borderColor: '#101012' }}
className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
/>
)}
</div>
<div>
<div className="text-xs font-semibold text-[#F5F5F2]">{contact.name}</div>
<div className="font-mono text-[11px] text-[#8E8E93]">{contact.iaAppNumber}</div>
<div className="text-[11px] text-[#8E8E93] mt-0.5">{contact.statusText}</div>
</div>
</div>
</div>
<div className="flex items-center justify-between gap-2 pt-2 border-t border-[#242426] text-[11px]">
<div className="flex items-center gap-1.5">
<button
type="button"
onClick={() => {
setActiveTab('chats');
handleSelectRoom('room-ana');
}}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-2.5 py-1 rounded font-medium"
>
Conversación directa
</button>
<button
type="button"
onClick={() => setSelectedContactProfile(contact)}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="px-2.5 py-1 rounded border"
>
Perfil
</button>
</div>
<button
type="button"
onClick={() => {
setContacts((prev) =>
prev.map((c) => (c.id === contact.id ? { ...c, blocked: !c.blocked } : c))
);
showToast(
contact.blocked ? 'Contacto desbloqueado.' : 'Contacto bloqueado en ContactsProvider.'
);
}}
className="text-[#8E8E93] hover:text-red-400 flex items-center gap-1"
>
<Ban className="w-3 h-3" />
<span>{contact.blocked ? 'Desbloquear' : 'Bloquear'}</span>
</button>
</div>
</div>
))}
</div>
{selectedContactProfile && (
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-xl border flex items-center justify-between"
>
<div className="space-y-1 text-xs">
<div className="font-semibold">
Perfil verificado: {selectedContactProfile.name}
</div>
<div className="text-[#8E8E93]">
Número IA.app: {selectedContactProfile.iaAppNumber} · Organización:{' '}
{selectedContactProfile.organization}
</div>
</div>
<button
type="button"
onClick={() => setSelectedContactProfile(null)}
className="text-xs text-[#8E8E93] hover:text-white"
>
Cerrar
</button>
</div>
)}
</div>
</div>
)}

{activeTab === 'agents' && (
<div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
<div className="max-w-5xl mx-auto space-y-6">
<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242426] pb-4">
<div>
<h1 className="text-base font-semibold tracking-tight">
Directorio de Inteligencias y Agentes
</h1>
<p className="text-xs text-[#8E8E93]">
Que un proveedor aparezca en el directorio no significa que esté conectado. Revisa su estado
real y permisos concedidos.
</p>
</div>
<button
type="button"
onClick={() => {
openProviderWizard(providers[2]);
}}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
>
<Sparkles className="w-3.5 h-3.5" />
<span>Conecta tus inteligencias</span>
</button>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{providers.map((prov) => (
<div
key={prov.id}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-xl border flex flex-col justify-between gap-4"
>
<div className="space-y-2.5">
<div className="flex items-start justify-between gap-2">
<div className="flex items-center gap-2.5">
<div
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="w-9 h-9 rounded-lg border flex items-center justify-center text-sm font-semibold"
>
{prov.logoSymbol}
</div>
<div>
<div className="text-xs font-semibold text-[#F5F5F2]">{prov.name}</div>
<div className="text-[10px] text-[#8E8E93]">{prov.vendor}</div>
</div>
</div>
<span
style={{
backgroundColor: '#000000',
borderColor:
prov.state === 'connected'
? '#22C55E'
: prov.state === 'pending_config'
? '#F59E0B'
: '#242426',
color:
prov.state === 'connected'
? '#22C55E'
: prov.state === 'pending_config'
? '#F59E0B'
: '#8E8E93'
}}
className="px-2 py-0.5 rounded-full border text-[10px] font-medium flex items-center gap-1"
>
{prov.state === 'connected' && (
<span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
)}
<span>
{prov.state === 'connected'
? 'Conectado'
: prov.state === 'pending_config'
? 'Pendiente de configuración'
: 'Disponible'}
</span>
</span>
</div>
<p className="text-xs text-[#8E8E93] leading-relaxed">{prov.description}</p>
<div className="space-y-1">
<div className="text-[10px] uppercase tracking-wider text-[#8E8E93]">
Capacidades contempladas:
</div>
<ul className="space-y-0.5 text-[11px] text-[#F5F5F2]">
{prov.capabilities.map((cap, idx) => (
<li key={idx} className="flex items-center gap-1.5">
<span className="text-[#8E8E93]">·</span>
<span>{cap}</span>
</li>
))}
</ul>
</div>
{prov.grantedScopes.length > 0 && (
<div className="pt-1">
<div className="text-[10px] text-[#8E8E93] mb-1">Permisos concedidos:</div>
<div className="flex flex-wrap gap-1">
{prov.grantedScopes.map((sc) => (
<span
key={sc}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="px-1.5 py-0.5 rounded border font-mono text-[10px] text-[#22C55E]"
>
{sc}
</span>
))}
</div>
</div>
)}
{prov.lastActivity && (
<div className="text-[10px] text-[#8E8E93]">
Última actividad: {prov.lastActivity}
</div>
)}
</div>
<div className="flex items-center justify-between gap-2 pt-3 border-t border-[#242426] text-xs">
{prov.state === 'connected' ? (
<>
<button
type="button"
onClick={() => openProviderWizard(prov)}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="px-3 py-1.5 rounded-lg border hover:bg-[#242426]"
>
Configuración y Permisos
</button>
<button
type="button"
onClick={() => handleDisconnectProvider(prov.id)}
className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-black"
>
Desconectar
</button>
</>
) : (
<button
type="button"
onClick={() => openProviderWizard(prov)}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="w-full py-1.5 rounded-lg font-medium"
>
Iniciar asistente de autorización
</button>
)}
</div>
</div>
))}
</div>

<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-xl border space-y-4"
>
<div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242426] pb-3">
<div>
<h2 className="text-sm font-semibold">VFORGE y Herramientas MCP Vinculadas</h2>
<p className="text-[11px] text-[#8E8E93]">
El frontend nunca recibe secretos permanentes de proveedores. Todos los permisos se validan
en el servidor.
</p>
</div>
<span className="text-[11px] text-[#22C55E] font-mono">MCPProvider · Activo</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
{mcpServers.map((srv) => (
<div
key={srv.id}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="p-3.5 rounded-lg border space-y-2"
>
<div className="flex items-center justify-between">
<span className="font-semibold">{srv.name}</span>
<span className="text-[10px] text-[#22C55E]">● {srv.status}</span>
</div>
<div className="text-[11px] text-[#8E8E93]">{srv.orgScope}</div>
<div className="text-[10px] text-[#8E8E93]">{srv.lastAudit}</div>
<div className="pt-1 space-y-1">
{srv.tools.map((t) => (
<div
key={t.name}
className="flex items-center justify-between text-[11px] py-1 border-t border-[#242426]"
>
<span className="font-mono">{t.name}</span>
<span className="text-[10px] text-[#8E8E93]">{t.scope}</span>
</div>
))}
</div>
</div>
))}
</div>
</div>
</div>
</div>
)}

{activeTab === 'activity' && (
<div className="flex-1 p-4 md:p-6 overflow-y-auto">
<div className="max-w-4xl mx-auto space-y-5">
<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242426] pb-4">
<div>
<h1 className="text-base font-semibold tracking-tight">Centro de Actividad y Auditoría</h1>
<p className="text-xs text-[#8E8E93]">
Eventos reales ordenados cronológicamente: invitaciones, autorizaciones y acciones de
herramientas MCP.
</p>
</div>
<button
type="button"
onClick={() => {
setActivities((prev) => prev.map((a) => ({ ...a, read: true })));
showToast('Toda la actividad fue marcada como leída.');
}}
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="px-3 py-1.5 rounded-lg border text-xs hover:bg-[#242426]"
>
Marcar todo como leído
</button>
</div>
<div className="flex items-center gap-1.5 overflow-x-auto pb-1">
{[
{ id: 'all', label: 'Todos' },
{ id: 'mcp_tool', label: 'Herramientas MCP' },
{ id: 'group', label: 'Grupos Mixtos' },
{ id: 'auth', label: 'Autorizaciones' },
{ id: 'contact', label: 'Contactos' },
{ id: 'system', label: 'Sistema' }
].map((f) => (
<button
key={f.id}
type="button"
onClick={() => setActivityFilter(f.id)}
style={{
backgroundColor: activityFilter === f.id ? '#F5F5F2' : '#101012',
color: activityFilter === f.id ? '#000000' : '#8E8E93',
borderColor: '#242426'
}}
className="px-3 py-1 rounded-full border text-xs font-medium shrink-0"
>
{f.label}
</button>
))}
</div>
<div className="space-y-2.5">
{filteredActivities.map((act) => (
<div
key={act.id}
style={{
backgroundColor: '#101012',
borderColor: act.read ? '#242426' : '#F5F5F2'
}}
className="p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs"
>
<div className="space-y-1">
<div className="flex items-center gap-2">
<span className="font-semibold text-[#F5F5F2]">{act.title}</span>
<span className="text-[10px] text-[#8E8E93]">· {act.timestamp}</span>
{!act.read && (
<span
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-1.5 py-0.2 rounded text-[9px] font-semibold"
>
NUEVO
</span>
)}
</div>
<p className="text-[#8E8E93]">{act.detail}</p>
<div className="text-[10px] text-[#8E8E93] flex items-center gap-2 pt-0.5">
<span>Actor: {act.actor}</span>
{act.authRef && <span className="font-mono text-[#22C55E]">[{act.authRef}]</span>}
</div>
</div>
{!act.read && (
<button
type="button"
onClick={() =>
setActivities((prev) =>
prev.map((a) => (a.id === act.id ? { ...a, read: true } : a))
)
}
style={{ borderColor: '#242426' }}
className="px-2 py-1 rounded border text-[10px] text-[#8E8E93] hover:text-white shrink-0"
>
Leído
</button>
)}
</div>
))}
</div>
</div>
</div>
)}

{activeTab === 'profile' && (
<div className="flex-1 p-4 md:p-6 overflow-y-auto">
<div className="max-w-3xl mx-auto space-y-6 text-xs">
<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242426] pb-4">
<div className="flex items-center gap-3.5">
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="w-14 h-14 rounded-full border flex items-center justify-center text-base font-semibold"
>
{currentUser.avatarLabel}
</div>
<div>
<h1 className="text-base font-semibold">{currentUser.displayName}</h1>
<div className="font-mono text-xs text-[#22C55E] mt-0.5">
Número IA.app: {currentUser.iaAppNumber}
</div>
<div className="text-[11px] text-[#8E8E93]">
El número único IA.app es permanente y se obtiene del servicio de identidad en servidor.
</div>
</div>
</div>
<button
type="button"
onClick={() => {
setSessionMode((m) => (m === 'identified' ? 'visitor' : 'identified'));
showToast(
sessionMode === 'identified'
? 'Sesión cerrada. Has vuelto al Modo Visitante.'
: 'Sesión iniciada con la identidad oficial de IA.app.',
'success'
);
}}
style={{
backgroundColor: sessionMode === 'identified' ? '#101012' : '#F5F5F2',
color: sessionMode === 'identified' ? '#F5F5F2' : '#000000',
borderColor: '#242426'
}}
className="px-3.5 py-2 rounded-lg border font-medium flex items-center gap-1.5"
>
<LogOut className="w-3.5 h-3.5" />
<span>
{sessionMode === 'identified' ? 'Cerrar sesión' : 'Entrar con Identidad IA.app'}
</span>
</button>
</div>
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-xl border space-y-3"
>
<div className="font-semibold text-sm">Identidad y Disponibilidad</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
<label className="space-y-1 block">
<span className="text-[#8E8E93]">Nombre visible</span>
<input
type="text"
value={profileDisplayName}
onChange={(e) => setProfileDisplayName(e.target.value)}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="w-full px-3 py-2 rounded-lg border text-xs text-[#F5F5F2]"
/>
</label>
<label className="space-y-1 block">
<span className="text-[#8E8E93]">Estado de presencia</span>
<select
value={profilePresence}
onChange={(e) => setProfilePresence(e.target.value as typeof profilePresence)}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="w-full px-3 py-2 rounded-lg border text-xs text-[#F5F5F2]"
>
<option value="online">Disponible (Verde de estado)</option>
<option value="busy">Ocupado / Enfoque</option>
<option value="offline">Ausente</option>
</select>
</label>
</div>
<label className="space-y-1 block">
<span className="text-[#8E8E93]">Descripción</span>
<input
type="text"
value={profileBio}
onChange={(e) => setProfileBio(e.target.value)}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="w-full px-3 py-2 rounded-lg border text-xs text-[#F5F5F2]"
/>
</label>
</div>
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-xl border space-y-3"
>
<div className="font-semibold text-sm">Privacidad, Notificaciones y Apariencia</div>
<div className="flex items-center justify-between py-1.5 border-b border-[#242426]">
<span>Confirmaciones de lectura en conversaciones</span>
<button
type="button"
onClick={() => setPrivacyReadReceipts((v) => !v)}
style={{
backgroundColor: privacyReadReceipts ? '#F5F5F2' : '#000000',
color: privacyReadReceipts ? '#000000' : '#8E8E93'
}}
className="px-2.5 py-1 rounded border border-[#242426] font-medium"
>
{privacyReadReceipts ? 'Activado' : 'Desactivado'}
</button>
</div>
<div className="flex items-center justify-between py-1.5 border-b border-[#242426]">
<span>Notificaciones de actividad de agentes</span>
<button
type="button"
onClick={() => setNotificationsEnabled((v) => !v)}
style={{
backgroundColor: notificationsEnabled ? '#F5F5F2' : '#000000',
color: notificationsEnabled ? '#000000' : '#8E8E93'
}}
className="px-2.5 py-1 rounded border border-[#242426] font-medium"
>
{notificationsEnabled ? 'Activas' : 'Silenciadas'}
</button>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
<label className="space-y-1 block">
<span className="text-[#8E8E93]">Idioma de la interfaz</span>
<select
value={profileLanguage}
onChange={(e) => setProfileLanguage(e.target.value as typeof profileLanguage)}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="w-full px-3 py-2 rounded-lg border text-xs text-[#F5F5F2]"
>
<option value="es-MX">Español (México)</option>
<option value="en-US">English (US)</option>
</select>
</label>
<label className="space-y-1 block">
<span className="text-[#8E8E93]">Acabado de superficie</span>
<select
value={profileTheme}
onChange={(e) => setProfileTheme(e.target.value as typeof profileTheme)}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="w-full px-3 py-2 rounded-lg border text-xs text-[#F5F5F2]"
>
<option value="pure-black">Negro Absoluto (#000000)</option>
<option value="deep-graphite">Gris Profundo (#101012)</option>
</select>
</label>
</div>
</div>
<div
style={{ backgroundColor: '#101012', borderColor: '#242426' }}
className="p-4 rounded-xl border space-y-3"
>
<div className="flex items-center justify-between">
<span className="font-semibold text-sm">Dispositivos, Sesiones y Conexiones</span>
<button
type="button"
onClick={() => setConnectionCenterOpen(true)}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-3 py-1 rounded font-medium"
>
Abrir "Conecta tus inteligencias"
</button>
</div>
<div className="text-[#8E8E93]">
Sesión actual: Navegador Web PWA (`https://iaapp.live`) · Adaptador Better Auth / OAuth.
</div>
</div>
</div>
</div>
)}

<nav
aria-label="Navegación inferior móvil"
style={{ backgroundColor: '#000000', borderTop: '1px solid #242426' }}
className={`${
viewportMode === 'mobile_390' ? 'grid' : 'grid md:hidden'
} grid-cols-5 py-1.5 px-1 shrink-0`}
>
{[
{ id: 'chats', label: 'Chats', icon: MessageSquare, badge: unreadRoomsCount },
{ id: 'contacts', label: 'Contactos', icon: Users, badge: 0 },
{ id: 'agents', label: 'Agentes', icon: Bot, badge: 0 },
{ id: 'activity', label: 'Actividad', icon: Bell, badge: unreadActivitiesCount },
{ id: 'profile', label: 'Perfil', icon: User, badge: 0 }
].map((item) => {
const Icon = item.icon;
const active = activeTab === item.id;
return (
<button
key={item.id}
type="button"
onClick={() => {
setActiveTab(item.id as typeof activeTab);
if (item.id === 'chats') setMobileChatOpen(false);
}}
style={{ color: active ? '#F5F5F2' : '#8E8E93' }}
className="relative flex flex-col items-center justify-center py-1 gap-0.5"
>
<Icon className="w-4 h-4" />
<span className="text-[10px] font-medium">{item.label}</span>
{item.badge > 0 && (
<span
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="absolute top-0.5 right-4 text-[9px] font-semibold px-1 rounded-full"
>
{item.badge}
</span>
)}
</button>
);
})}
</nav>
</div>
</div>
)}

{connectionCenterOpen && (
<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
<div
style={{ backgroundColor: '#101012', borderColor: '#242426', color: '#F5F5F2' }}
className="w-full max-w-xl rounded-2xl border p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto"
>
<div className="flex items-center justify-between border-b border-[#242426] pb-3">
<div>
<div className="text-[10px] uppercase tracking-widest text-[#8E8E93]">
Centro de Conexiones y Permisos
</div>
<h2 className="text-base font-semibold mt-0.5">Conecta tus inteligencias</h2>
</div>
<button
type="button"
onClick={() => setConnectionCenterOpen(false)}
className="text-[#8E8E93] hover:text-white"
>
<X className="w-4 h-4" />
</button>
</div>
<div className="grid grid-cols-6 gap-1 text-[10px] text-center">
{[
'1. Proveedor',
'2. Capacidades',
'3. Permisos',
'4. Autorización',
'5. Confirmación',
'6. Revocación'
].map((label, idx) => {
const stepNum = idx + 1;
const active = wizardStep === stepNum;
return (
<button
key={label}
type="button"
onClick={() => setWizardStep(stepNum)}
style={{
backgroundColor: active ? '#F5F5F2' : '#000000',
color: active ? '#000000' : '#8E8E93',
borderColor: '#242426'
}}
className="py-1 px-1 rounded border truncate font-medium"
>
{label}
</button>
);
})}
</div>
{wizardStep === 1 && (
<div className="space-y-3">
<p className="text-[#8E8E93]">
Paso 1 · Elige el proveedor que deseas vincular a tu cuenta IA.app. Nunca solicitamos contraseñas de
terceros ni instalamos extensiones silenciosas.
</p>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
{providers.map((p) => (
<button
key={p.id}
type="button"
onClick={() => {
setWizardProvider(p);
setWizardStep(2);
}}
style={{
backgroundColor: wizardProvider?.id === p.id ? '#242426' : '#000000',
borderColor: '#242426'
}}
className="p-3 rounded-xl border text-left flex items-center justify-between"
>
<div>
<div className="font-semibold">
{p.logoSymbol} {p.name}
</div>
<div className="text-[10px] text-[#8E8E93]">{p.vendor}</div>
</div>
<ChevronRight className="w-4 h-4 text-[#8E8E93]" />
</button>
))}
</div>
</div>
)}
{wizardStep === 2 && (
<div className="space-y-3">
<div className="font-semibold">
Paso 2 · Capacidades solicitadas por {wizardProvider?.name || 'el proveedor'}
</div>
<ul className="space-y-1.5 bg-black p-3 rounded-xl border border-[#242426]">
{(wizardProvider?.capabilities || []).map((c, i) => (
<li key={i} className="flex items-center gap-2">
<Check className="w-3.5 h-3.5 text-[#22C55E]" />
<span>{c}</span>
</li>
))}
</ul>
<div className="p-2.5 rounded-lg bg-black border border-[#242426] text-[11px] text-[#8E8E93]">
Garantía de privacidad: IA.app no afirma ni solicita acceso al historial externo de tus cuentas de
ChatGPT o Gemini.
</div>
<div className="flex justify-end gap-2">
<button
type="button"
onClick={() => setWizardStep(1)}
className="px-3 py-1.5 rounded border border-[#242426]"
>
Atrás
</button>
<button
type="button"
onClick={() => setWizardStep(3)}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-3.5 py-1.5 rounded font-medium"
>
Revisar permisos
</button>
</div>
</div>
)}
{wizardStep === 3 && (
<div className="space-y-3">
<div className="font-semibold">Paso 3 · Aceptar o rechazar alcances específicos</div>
<div className="space-y-2">
{[
{
scope: 'room.messages.read_mentioned',
label: 'Leer mensajes únicamente cuando el agente sea mencionado en la sala'
},
{
scope: 'room.messages.reply',
label: 'Publicar respuestas identificadas como Agente IA en salas autorizadas'
},
{
scope: 'mcp.tools.invoke_approved',
label: 'Ejecutar herramientas MCP previamente aprobadas por el usuario'
}
].map((item) => {
const checked = wizardSelectedScopes.includes(item.scope);
return (
<label
key={item.scope}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="p-3 rounded-xl border flex items-center justify-between cursor-pointer"
>
<div>
<div className="font-medium">{item.label}</div>
<div className="font-mono text-[10px] text-[#8E8E93]">{item.scope}</div>
</div>
<input
type="checkbox"
checked={checked}
onChange={() =>
setWizardSelectedScopes((prev) =>
checked ? prev.filter((x) => x !== item.scope) : [...prev, item.scope]
)
}
/>
</label>
);
})}
</div>
<div className="flex justify-end gap-2">
<button
type="button"
onClick={() => setConnectionCenterOpen(false)}
className="px-3 py-1.5 rounded border border-[#242426] text-red-400"
>
Rechazar
</button>
<button
type="button"
onClick={() => setWizardStep(4)}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-3.5 py-1.5 rounded font-medium"
>
Aceptar alcances y continuar
</button>
</div>
</div>
)}
{wizardStep === 4 && (
<div className="space-y-3">
<div className="font-semibold">
Paso 4 · Autorización en servidor ({wizardProvider?.endpointContract})
</div>
<p className="text-[#8E8E93]">
La autorización se realiza mediante flujo OAuth / código de emparejamiento de un solo uso validado en
el servidor de IA.app. Ninguna credencial ni token maestro queda guardado en el navegador.
</p>
<div className="flex justify-end gap-2">
<button
type="button"
onClick={() => setWizardStep(3)}
className="px-3 py-1.5 rounded border border-[#242426]"
>
Atrás
</button>
<button
type="button"
onClick={completeProviderAuthorization}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-3.5 py-1.5 rounded font-medium"
>
Confirmar autorización en adaptador
</button>
</div>
</div>
)}
{(wizardStep === 5 || wizardStep === 6) && (
<div className="space-y-3">
<div className="p-3 rounded-xl bg-black border border-[#242426] space-y-1">
<div className="text-[#22C55E] font-semibold">
✓ Estado verificado en PermissionsProvider: {wizardProvider?.name}
</div>
<div className="text-[11px] text-[#8E8E93]">
Alcances activos: {wizardSelectedScopes.join(', ') || 'Ninguno'}
</div>
</div>
<div className="flex items-center justify-between pt-2">
{wizardProvider && (
<button
type="button"
onClick={() => {
handleDisconnectProvider(wizardProvider.id);
setConnectionCenterOpen(false);
}}
className="px-3 py-1.5 rounded border border-[#242426] text-red-400"
>
Revocar permisos ahora
</button>
)}
<button
type="button"
onClick={() => setConnectionCenterOpen(false)}
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-4 py-1.5 rounded font-medium ml-auto"
>
Listo
</button>
</div>
</div>
)}
</div>
</div>
)}

{newRoomModal && (
<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
<form
onSubmit={handleCreateRoom}
style={{ backgroundColor: '#101012', borderColor: '#242426', color: '#F5F5F2' }}
className="w-full max-w-md rounded-2xl border p-5 space-y-4 text-xs"
>
<div className="flex items-center justify-between border-b border-[#242426] pb-3">
<h2 className="text-sm font-semibold">
{newRoomModal === 'group'
? 'Crear Nuevo Grupo Mixto (Humanos + Inteligencias)'
: 'Iniciar Nueva Conversación Directa'}
</h2>
<button
type="button"
onClick={() => setNewRoomModal(null)}
className="text-[#8E8E93] hover:text-white"
>
<X className="w-4 h-4" />
</button>
</div>
<label className="space-y-1 block">
<span className="text-[#8E8E93]">Nombre de la sala o proyecto</span>
<input
type="text"
required
value={newRoomTitle}
onChange={(e) => setNewRoomTitle(e.target.value)}
placeholder={newRoomModal === 'group' ? 'Ej. Comité de Lanzamiento IA.app' : 'Ej. Sala con Marco'}
style={{ backgroundColor: '#000000', borderColor: '#242426' }}
className="w-full px-3 py-2 rounded-lg border text-xs text-[#F5F5F2]"
/>
</label>
{newRoomModal === 'group' && (
<div className="space-y-2">
<div className="text-[#8E8E93]">Agentes conectados incluidos con permisos por mención:</div>
<div className="flex flex-wrap gap-1.5">
{providers
.filter((p) => p.state === 'connected')
.map((p) => {
const active = newGroupAgents.includes(p.name);
return (
<button
key={p.id}
type="button"
onClick={() =>
setNewGroupAgents((prev) =>
active ? prev.filter((x) => x !== p.name) : [...prev, p.name]
)
}
style={{
backgroundColor: active ? '#F5F5F2' : '#000000',
color: active ? '#000000' : '#8E8E93',
borderColor: '#242426'
}}
className="px-2.5 py-1 rounded-full border text-[11px] font-medium"
>
{p.logoSymbol} {p.name}
</button>
);
})}
</div>
</div>
)}
<div className="flex justify-end gap-2 pt-2">
<button
type="button"
onClick={() => setNewRoomModal(null)}
className="px-3 py-1.5 rounded border border-[#242426]"
>
Cancelar
</button>
<button
type="submit"
style={{ backgroundColor: '#F5F5F2', color: '#000000' }}
className="px-4 py-1.5 rounded font-medium"
>
Crear sala
</button>
</div>
</form>
</div>
)}
</div>
);
}