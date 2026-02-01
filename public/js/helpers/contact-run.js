import { buildContactParams } from "../util/params.js";
import { sendToBack } from "../util/api-front.js";

export const runContactSubmit = async () => {
    const contactParams = await buildContactParams();
    console.log("CONTACT PARAMS:");
    console.dir(contactParams);

    const data = await sendToBack(contactParams);
    console.log("CONTACT DATA:");
    console.dir(data);
};
