import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { LayoutDashboard, PenBox } from "lucide-react";
import { checkUser } from "@/lib/checkUser";

const Header = async () => {
  await checkUser();
  return (
    <div className = "fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
       <nav className = "container mx-auto px-4 py-4 flex items-center justify-between">
           <Link href="/">
               <Image
                   src={"/financial_transparent.png"} 
                   alt="cashlytic logo" 
                   height={120} 
                   width={300}
                   className="h-15 w-auto object-contain"
               />
           </Link> 
        <div className = "flex items-center space-x-4">
                <SignedIn>
                    <Link href = {"/dashboard"} className = "text-gray-600 hover:text-teal-600 flex items-center gap-2">
                        <Button variant= "outline">
                            <LayoutDashboard size = {18}/>
                            <span className = "hidden md:inline">Dashboard</span>
                        </Button>
                    </Link>
                    <Link href = {"/transaction/create"} className = "text-gray-600 hover:text-teal-600 flex items-center gap-2">
                        <Button className = "flex items-center gap-2">
                            <PenBox size = {18}/>
                            <span className = "hidden md:inline">Add Transaction</span>
                        </Button>
                    </Link>
                </SignedIn>
                <SignedOut>
                    <SignInButton forceRedirectUrl = "/dashboard">
                        <Button variant= "outline"> login </Button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <div className="scale-140 flex items-center justify-center">
                        <UserButton 
                            appearance={{
                                elements: {
                                    avatarBox: "width: 48px; height: 48px;",
                                    userButtonAvatarBox: "width: 48px; height: 48px;"
                                }
                            }}
                        />
                    </div>
                </SignedIn>
           </div>
       </nav>  
    </div>
  )
}

export default Header;