export type HeaderBlock = {key:string;type:'brand'|'navigation'|'utilities';order:number;settings:Record<string,string|boolean>};
export type HeaderItem = {key:string;label:string;href:string;type:'browse'|'link'|'external'};
export type HeaderData = {
 schema:string;section:{id:string;type:'global-header';settings:{background:string;foreground:string;height:number;sticky:boolean}};
 blocks:HeaderBlock[];navigation:{menu_name:string;items:HeaderItem[]};
};
export function normalizeHeader(input:unknown):HeaderData;
export function headerFromCmsRows(section:Record<string,unknown>,blocks:Record<string,unknown>[],menu:Record<string,unknown>):HeaderData;
export const defaultHeader:HeaderData;
