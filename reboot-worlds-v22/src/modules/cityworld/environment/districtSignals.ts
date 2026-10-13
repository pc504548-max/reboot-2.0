import { create } from 'zustand'
import type { CityId } from '../cityRegistry'
export const useDistrictSignals=create<{
  landmark:CityId|null; resident:{city:CityId;index:number}|null; pulse:number; repairPreview:boolean
  open:(city:CityId)=>void; inspect:(city:CityId,index:number)=>void; signal:()=>void; close:()=>void; preview:()=>void
}>(set=>({
  landmark:null,resident:null,pulse:0,repairPreview:false,
  open:landmark=>set({landmark,resident:null,pulse:performance.now()}),
  inspect:(city,index)=>set({resident:{city,index},landmark:null,pulse:performance.now()}),
  signal:()=>set({pulse:performance.now()}),
  close:()=>set({landmark:null,resident:null,repairPreview:false}),
  preview:()=>set({repairPreview:true,pulse:performance.now()}),
}))
