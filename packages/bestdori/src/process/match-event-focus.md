You will be provided with a sequence of images. The first few images are a batch of event banners from a mobile game. The remaining images are a pool of card illustrations from the same game. 


Your task is to identify which card illustration was directly cropped and used to create each event banner. 


Please structure your response strictly as a JSON object matching the banner image identifiers to the correct card illustration image identifiers. Do not include any conversational text, markdown formatting blocks, or explanations.


Example output:
{
  "banner_1": "card_3",
  "banner_2": "card_1"
}