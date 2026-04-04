import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export const metadata = {
  title: "Disclaimer - Sunloved",
}

export default function DisclaimerPage() {
  return (
    <main className="mesh-page">
      <Header />
      
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-8">Disclaimer</h1>
          
          <div className="space-y-8">
            <p className="text-gray-600 text-lg">
              Last updated: November 2025
            </p>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. General Disclaimer</h2>
              <p className="text-gray-600">
                The information provided by Sunloved is for informational purposes only. While we strive to provide accurate and up-to-date information, we make no warranties, expressed or implied, about the accuracy, completeness, or reliability of any information, product, or service contained on our website.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Skincare Information</h2>
              <p className="text-gray-600">
                The skincare product information and recommendations provided by Sunloved are for educational purposes and should not be considered medical advice. Individual skin types and sensitivities vary greatly. We recommend:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
                <li>Conducting a patch test before using any new product</li>
                <li>Consulting with a dermatologist for persistent skin concerns</li>
                <li>Reading and following all product instructions and warnings</li>
                <li>Stopping use immediately if you experience irritation or allergic reactions</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Product Availability</h2>
              <p className="text-gray-600">
                Product availability, pricing, and specifications are subject to change without notice. We do not guarantee that products will remain in stock or that prices will remain constant. Information may not reflect the most current product details.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Links</h2>
              <p className="text-gray-600">
                Sunloved may contain links to third-party websites. We are not responsible for the content, accuracy, or practices of these external sites. Your use of third-party websites is at your own risk and governed by their terms of service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Verification</h2>
              <p className="text-gray-600">
                We verify product data and claims to the best of our ability using publicly available sources. However, we cannot guarantee the absolute accuracy of all information. Companies may update their products or claims, and we may not immediately reflect these changes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-600">
                In no event shall Sunloved be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the website or services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Indemnification</h2>
              <p className="text-gray-600">
                You agree to indemnify and hold Sunloved harmless from any claims, damages, losses, or expenses arising from your use of our website or services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Disclaimer</h2>
              <p className="text-gray-600">
                We reserve the right to modify this disclaimer at any time. Your continued use of the website after modifications constitutes your acceptance of the updated disclaimer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}


