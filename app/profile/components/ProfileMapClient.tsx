"use client"

import dynamic from "next/dynamic"

const ProfileMap = dynamic(() => import("./profile_map"), { ssr: false })

export default ProfileMap